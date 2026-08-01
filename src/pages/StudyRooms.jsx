import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './StudyRooms.css'

function generateToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 16; i++) token += chars[Math.floor(Math.random() * chars.length)]
  return token
}

export default function StudyRooms() {
  const { user, profile, addXp, unlockAchievement, refresh } = useApp()
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeRoom, setActiveRoom] = useState(null)
  const [members, setMembers] = useState([])
  const [form, setForm] = useState({ name: '', description: '', subject: '', timer_duration: 25, max_participants: 10, is_public: true })
  const [chat, setChat] = useState([])
  const [chatMsg, setChatMsg] = useState('')
  const [ready, setReady] = useState(false)
  const [roomPhase, setRoomPhase] = useState('idle')
  const [timeLeft, setTimeLeft] = useState(0)
  const [inviteLink, setInviteLink] = useState('')
  const [inviteCopied, setInviteCopied] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [joinError, setJoinError] = useState('')

  const fetchRooms = useCallback(async () => {
    const { data } = await supabase.from('study_rooms').select('*, room_members(count)').eq('is_public', true).order('created_at', { ascending: false })
    setRooms(data || []); setLoading(false)
  }, [])

  useEffect(() => { fetchRooms() }, [fetchRooms])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const inviteToken = params.get('invite')
    if (inviteToken) {
      handleInviteJoin(inviteToken)
      params.delete('invite')
      window.history.replaceState({}, '', `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`)
    }
  }, [])

  const handleInviteJoin = async (token) => {
    setJoinError('')
    const { data: invite, error } = await supabase.from('room_invites').select('*, room:study_rooms(*)').eq('token', token).maybeSingle()
    if (error || !invite) { setJoinError('Invalid invite link.'); return }
    if (new Date(invite.expires_at) < new Date()) { setJoinError('This invite link has expired.'); return }
    joinRoom(invite.room)
  }

  const fetchMembers = useCallback(async (roomId) => {
    const { data } = await supabase.from('room_members').select('*, profile:profiles!room_members_user_id_fkey(*)').eq('room_id', roomId)
    setMembers(data || [])
  }, [])

  useEffect(() => {
    if (!activeRoom) return
    fetchMembers(activeRoom.id)
    const interval = setInterval(() => fetchMembers(activeRoom.id), 5000)
    return () => clearInterval(interval)
  }, [activeRoom, fetchMembers])

  const createRoom = async () => {
    if (!form.name.trim()) return
    const { data } = await supabase.from('study_rooms').insert({ name: form.name.trim(), description: form.description, subject: form.subject, timer_duration: form.timer_duration, max_participants: form.max_participants, is_public: form.is_public }).select().single()
    if (data) {
      await supabase.from('room_members').insert({ room_id: data.id, user_id: user.id, role: 'host' })
      setShowCreate(false); setForm({ name: '', description: '', subject: '', timer_duration: 25, max_participants: 10, is_public: true })
      fetchRooms(); joinRoom(data)
    }
  }

  const joinRoom = async (room) => {
    const existing = members.find(m => m.user_id === user.id)
    if (!existing) await supabase.from('room_members').insert({ room_id: room.id, user_id: user.id, role: 'member' })
    setActiveRoom(room); setRoomPhase(room.current_phase || 'idle'); setTimeLeft(room.timer_duration * 60); setReady(false)
    setInviteLink(''); setInviteCopied(false); setInviteError('')
    fetchMembers(room.id)
  }

  const leaveRoom = async () => {
    if (activeRoom) await supabase.from('room_members').delete().eq('room_id', activeRoom.id).eq('user_id', user.id)
    setActiveRoom(null); setMembers([]); setChat([]); refresh(); fetchRooms()
  }

  const toggleReady = async () => {
    const newReady = !ready; setReady(newReady)
    await supabase.from('room_members').update({ is_ready: newReady }).eq('room_id', activeRoom.id).eq('user_id', user.id)
    fetchMembers(activeRoom.id)
  }

  const startSession = async () => {
    const dur = activeRoom.timer_duration * 60
    setRoomPhase('studying'); setTimeLeft(dur)
    await supabase.from('study_rooms').update({ current_phase: 'studying', phase_ends_at: new Date(Date.now() + dur * 1000).toISOString() }).eq('id', activeRoom.id)
  }

  useEffect(() => {
    if (roomPhase === 'studying' && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(t)
    } else if (roomPhase === 'studying' && timeLeft === 0) {
      setRoomPhase('break'); setTimeLeft(5 * 60)
    } else if (roomPhase === 'break' && timeLeft === 0) {
      setRoomPhase('idle')
      addXp(25); unlockAchievement('study_together')
    }
  }, [roomPhase, timeLeft])

  const sendChat = () => {
    if (!chatMsg.trim()) return
    setChat([...chat, { user: profile?.username || 'You', msg: chatMsg.trim(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    setChatMsg('')
  }

  const generateInvite = async () => {
    setInviteError(''); setInviteCopied(false)
    const token = generateToken()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()
    const { error } = await supabase.from('room_invites').insert({ room_id: activeRoom.id, created_by: user.id, token, expires_at: expiresAt })
    if (error) { setInviteError('Could not create invite link.'); return }
    const link = `${window.location.origin}/?invite=${token}`
    setInviteLink(link)
  }

  const copyInvite = () => {
    if (!inviteLink) return
    navigator.clipboard.writeText(inviteLink).then(() => { setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000) })
  }

  const formatTime = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
  const memberCount = members.length
  const readyCount = members.filter(m => m.is_ready).length
  const progress = activeRoom && roomPhase !== 'idle' ? ((activeRoom.timer_duration * 60 - timeLeft) / (activeRoom.timer_duration * 60)) * 100 : 0
  const isHost = members.some(m => m.user_id === user.id && m.role === 'host')

  if (activeRoom) {
    return (
      <div className="sr-room-page">
        <div className="sr-room-header">
          <button className="btn btn-ghost btn-sm" onClick={leaveRoom}>← Leave Room</button>
          <div><h2>{activeRoom.name}</h2>{activeRoom.subject && <span className="dash-empty">{activeRoom.subject}</span>}</div>
          <div className="sr-phase-badge" style={{ background: roomPhase === 'studying' ? 'var(--success-l)' : roomPhase === 'break' ? 'var(--warning-l)' : 'var(--surface-2)', color: roomPhase === 'studying' ? 'var(--success)' : roomPhase === 'break' ? 'var(--warning)' : 'var(--text-2)' }}>{roomPhase === 'studying' ? '📖 Studying' : roomPhase === 'break' ? '☕ Break' : '⏸️ Waiting'}</div>
        </div>

        {isHost && (
          <div className="sr-invite-section">
            <div className="sr-invite-header">
              <h3>Invite Link</h3>
              {!inviteLink ? (
                <button className="btn btn-outline btn-sm" onClick={generateInvite}>Generate Invite Link</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={copyInvite}>{inviteCopied ? 'Copied!' : 'Copy Link'}</button>
              )}
            </div>
            {inviteLink && (
              <div className="sr-invite-info">
                <code className="sr-invite-link">{inviteLink}</code>
                <span className="sr-invite-expiry">Expires in 10 minutes</span>
              </div>
            )}
            {inviteError && <div className="ai-error" style={{ marginTop: 8 }}>{inviteError}</div>}
            <p className="dash-empty" style={{ fontSize: 12, marginTop: 6 }}>Share this link with friends. They can join even if the room is private. The link expires after 10 minutes.</p>
          </div>
        )}

        {joinError && <div className="ai-error">{joinError}</div>}

        {roomPhase !== 'idle' && (
          <div className="sr-timer-section">
            <div className="sr-timer-display">{formatTime(timeLeft)}</div>
            <div className="sr-progress-bar"><div className="sr-progress-fill" style={{ width: `${progress}%`, background: roomPhase === 'studying' ? 'var(--success)' : 'var(--warning)' }} /></div>
          </div>
        )}

        <div className="sr-room-body">
          <div className="sr-participants">
            <h3>Participants ({memberCount}/{activeRoom.max_participants})</h3>
            <div className="sr-member-list">
              {members.map(m => (
                <div key={m.id} className={`sr-member ${m.is_ready ? 'ready' : ''}`}>
                  <span className="sr-member-avatar" style={{ background: 'var(--primary)' }}>{m.profile?.avatar_emoji || '👤'}</span>
                  <span className="sr-member-name">{m.profile?.username || 'Unknown'}{m.role === 'host' && ' 👑'}</span>
                  <span className="sr-member-status">{m.is_ready ? '✅ Ready' : '⏳ Not Ready'}</span>
                </div>
              ))}
            </div>
            <div className="sr-ready-section">
              <button className={`btn ${ready ? 'btn-outline' : 'btn-primary'}`} onClick={toggleReady}>{ready ? 'Not Ready' : 'Ready Up'}</button>
              {roomPhase === 'idle' && readyCount === memberCount && memberCount > 0 && <button className="btn btn-primary" onClick={startSession}>Start Session</button>}
            </div>
          </div>

          <div className="sr-chat">
            <h3>Chat</h3>
            <div className="sr-chat-messages">
              {chat.length === 0 ? <div className="dash-empty" style={{ textAlign: 'center', padding: 20 }}>No messages yet. Say hi! 👋</div> : chat.map((c, i) => (
                <div key={i} className="sr-chat-msg"><span className="sr-chat-user">{c.user}</span><span className="sr-chat-text">{c.msg}</span><span className="sr-chat-time">{c.time}</span></div>
              ))}
            </div>
            <div className="sr-chat-input"><input value={chatMsg} onChange={e => setChatMsg(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && sendChat()} /><button className="btn btn-primary btn-sm" onClick={sendChat}>Send</button></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sr-page">
      <div className="page-toolbar"><div><h2>Study Rooms</h2><p className="page-desc">Join virtual study rooms and study together</p></div><button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Create Room'}</button></div>

      {joinError && <div className="ai-error" style={{ marginBottom: 16 }}>{joinError}</div>}

      {showCreate && (
        <div className="form-card">
          <h3>Create Study Room</h3>
          <div className="form-field"><label>Room Name</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Math Study Group" /></div>
          <div className="form-field"><label>Description</label><textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="What will you be studying?" rows={2} /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics" /></div>
            <div className="form-field"><label>Timer (minutes)</label><input type="number" value={form.timer_duration} onChange={e => setForm({ ...form, timer_duration: parseInt(e.target.value) || 25 })} min="5" max="90" /></div>
          </div>
          <div className="form-row">
            <div className="form-field"><label>Max Participants</label><input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: parseInt(e.target.value) || 10 })} min="2" max="50" /></div>
            <div className="form-field"><label>Visibility</label><select value={form.is_public ? 'public' : 'private'} onChange={e => setForm({ ...form, is_public: e.target.value === 'public' })}><option value="public">Public</option><option value="private">Private</option></select></div>
          </div>
          <div className="form-actions"><button className="btn btn-primary" onClick={createRoom}>Create Room</button></div>
        </div>
      )}

      {loading ? (
        <div className="card"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '20px auto' }} /></div>
      ) : rooms.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>🏠</div><h3>No study rooms yet</h3><p>Create the first one and invite your friends!</p><button className="btn btn-primary" onClick={() => setShowCreate(true)}>Create Room</button></div>
      ) : (
        <div className="sr-list">
          {rooms.map(room => (
            <div key={room.id} className="sr-card" onClick={() => joinRoom(room)}>
              <div className="sr-card-top"><span className="sr-card-icon">🏠</span><span className={`sr-visibility ${room.is_public ? 'public' : 'private'}`}>{room.is_public ? 'Public' : 'Private'}</span></div>
              <h3>{room.name}</h3>
              {room.description && <p className="dash-empty">{room.description}</p>}
              <div className="sr-card-stats">
                <span>⏱️ {room.timer_duration}min</span>
                <span>👥 {room.room_members?.[0]?.count || 0}/{room.max_participants}</span>
                {room.subject && <span>📚 {room.subject}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
