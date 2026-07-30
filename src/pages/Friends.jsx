import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { getStreak } from '../lib/helpers.js'
import './Friends.css'

export default function Friends({ onNavigate }) {
  const { user, profile, friends, friendRequests, refresh, addXp, unlockAchievement, pushNotification } = useApp()
  const [tab, setTab] = useState('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [friendProfiles, setFriendProfiles] = useState({})

  useEffect(() => {
    const fetchProfiles = async () => {
      const ids = friends.map(f => f.friend_id)
      if (ids.length === 0) return
      const { data } = await supabase.from('profiles').select('*').in('user_id', ids)
      if (data) {
        const map = {}; data.forEach(p => { map[p.user_id] = p }); setFriendProfiles(map)
      }
    }
    fetchProfiles()
  }, [friends])

  const searchUsers = async () => {
    if (!searchQuery.trim()) { setSearchResults([]); return }
    setSearching(true)
    const { data } = await supabase.from('profiles').select('*').ilike('username', `%${searchQuery.trim()}%`).limit(20)
    setSearchResults(data || [])
    setSearching(false)
  }

  const sendRequest = async (targetUserId) => {
    const { data: existing } = await supabase.from('friend_requests').select('*').eq('sender_id', user.id).eq('receiver_id', targetUserId).maybeSingle()
    if (existing) return
    const isFriend = friends.some(f => f.friend_id === targetUserId)
    if (isFriend || targetUserId === user.id) return
    await supabase.from('friend_requests').insert({ sender_id: user.id, receiver_id: targetUserId, status: 'pending' })
    await pushNotification(targetUserId, 'friend_request', 'New Friend Request', `${profile?.username || 'Someone'} wants to be your friend!`)
    refresh()
  }

  const acceptRequest = async (req) => {
    await supabase.from('friend_requests').update({ status: 'accepted' }).eq('id', req.id)
    await supabase.from('friends').insert({ user_id: user.id, friend_id: req.sender_id })
    await supabase.from('friends').insert({ user_id: req.sender_id, friend_id: user.id })
    await pushNotification(req.sender_id, 'friend_accepted', 'Friend Request Accepted', `${profile?.username || 'Someone'} accepted your friend request!`)
    addXp(30); unlockAchievement('first_friend')
    refresh()
  }

  const declineRequest = async (req) => {
    await supabase.from('friend_requests').update({ status: 'declined' }).eq('id', req.id)
    refresh()
  }

  const removeFriend = async (friendId) => {
    await supabase.from('friends').delete().eq('user_id', user.id).eq('friend_id', friendId)
    await supabase.from('friends').delete().eq('user_id', friendId).eq('friend_id', user.id)
    refresh()
  }

  const getFriendStats = (fp) => {
    if (!fp) return null
    return {
      streak: fp.study_streak || 0,
      level: fp.level || 1,
      hours: Math.floor((fp.total_minutes || 0) / 60),
      favorite: fp.favorite_subject || 'Not set',
      status: fp.status || 'offline',
    }
  }

  const statusColor = (status) => {
    if (status === 'studying') return '#22c55e'
    if (status === 'busy') return '#f59e0b'
    return '#9ca3b8'
  }

  return (
    <div className="friends-page">
      <div className="page-toolbar">
        <div><h2>Friends</h2><p className="page-desc">Study together, stay motivated</p></div>
        <div className="friends-tabs">
          <button className={`ftab ${tab === 'friends' ? 'active' : ''}`} onClick={() => setTab('friends')}>Friends ({friends.length})</button>
          <button className={`ftab ${tab === 'requests' ? 'active' : ''}`} onClick={() => setTab('requests')}>Requests{friendRequests.length > 0 && <span className="req-badge">{friendRequests.length}</span>}</button>
          <button className={`ftab ${tab === 'search' ? 'active' : ''}`} onClick={() => setTab('search')}>Search</button>
        </div>
      </div>

      {tab === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>👥</div><h3>No friends yet</h3><p>Search for users to add them as friends.</p><button className="btn btn-primary" onClick={() => setTab('search')}>Find Friends</button></div>
          ) : friends.map(f => {
            const fp = friendProfiles[f.friend_id]
            const stats = getFriendStats(fp)
            return (
              <div key={f.id} className="friend-card">
                <div className="friend-avatar" style={{ background: 'var(--primary)' }}>{fp?.avatar_emoji || '👤'}</div>
                <div className="friend-info">
                  <div className="friend-name-row">
                    <h3>{fp?.username || 'Unknown'}</h3>
                    <span className="friend-status" style={{ background: statusColor(stats?.status) + '30', color: statusColor(stats?.status) }}>{stats?.status || 'offline'}</span>
                  </div>
                  {stats && (
                    <div className="friend-stats">
                      <span>🔥 {stats.streak}d streak</span>
                      <span>⭐ Lvl {stats.level}</span>
                      <span>⏱️ {stats.hours}h</span>
                      <span>📚 {stats.favorite}</span>
                    </div>
                  )}
                </div>
                <div className="friend-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('comparestats', f.friend_id)}>Compare</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => removeFriend(f.friend_id)}>Remove</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'requests' && (
        <div className="friends-list">
          {friendRequests.length === 0 ? (
            <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📭</div><h3>No pending requests</h3><p>You're all caught up!</p></div>
          ) : friendRequests.map(req => (
            <div key={req.id} className="friend-card">
              <div className="friend-avatar" style={{ background: 'var(--primary)' }}>{req.sender?.avatar_emoji || '👤'}</div>
              <div className="friend-info">
                <h3>{req.sender?.username || 'Unknown'}</h3>
                <p className="dash-empty">Wants to be your friend</p>
              </div>
              <div className="friend-actions">
                <button className="btn btn-primary btn-sm" onClick={() => acceptRequest(req)}>Accept</button>
                <button className="btn btn-ghost btn-sm" onClick={() => declineRequest(req)}>Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'search' && (
        <div className="search-section">
          <div className="search-bar">
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by username..." onKeyDown={(e) => e.key === 'Enter' && searchUsers()} />
            <button className="btn btn-primary btn-sm" onClick={searchUsers} disabled={searching}>{searching ? 'Searching...' : 'Search'}</button>
          </div>
          <div className="search-results">
            {searchResults.length === 0 && searchQuery ? (
              <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>🔍</div><h3>No users found</h3><p>Try a different search term.</p></div>
            ) : searchResults.map(sp => {
              if (sp.user_id === user.id) return null
              const isFriend = friends.some(f => f.friend_id === sp.user_id)
              return (
                <div key={sp.user_id} className="friend-card">
                  <div className="friend-avatar" style={{ background: 'var(--primary)' }}>{sp.avatar_emoji || '👤'}</div>
                  <div className="friend-info"><h3>{sp.username}</h3><p className="dash-empty">Level {sp.level || 1} · {sp.school || 'No school'}</p></div>
                  <div className="friend-actions">
                    {isFriend ? <span className="dash-empty">Already friends</span> : <button className="btn btn-primary btn-sm" onClick={() => sendRequest(sp.user_id)}>Add Friend</button>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
