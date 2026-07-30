import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './SharedNotes.css'

export default function SharedNotes({ onNavigate }) {
  const { user, profile, subjects, addXp, unlockAchievement, refresh, pushNotification } = useApp()
  const [tab, setTab] = useState('trending')
  const [notes, setNotes] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [activeNote, setActiveNote] = useState(null)
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [likedNotes, setLikedNotes] = useState(new Set())
  const [form, setForm] = useState({ title: '', description: '', subject: '', content: '', tags: '', visibility: 'public' })

  const fetchNotes = useCallback(async () => {
    let query = supabase.from('shared_notes').select('*, author:profiles!shared_notes_user_id_fkey(username, avatar_emoji)').eq('visibility', 'public')
    if (tab === 'trending') query = query.order('like_count', { ascending: false }).limit(20)
    else if (tab === 'recent') query = query.order('created_at', { ascending: false }).limit(20)
    else if (tab === 'downloads') query = query.order('download_count', { ascending: false }).limit(20)
    else if (tab === 'mine') query = supabase.from('shared_notes').select('*, author:profiles!shared_notes_user_id_fkey(username, avatar_emoji)').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data } = await query
    setNotes(data || []); setLoading(false)
  }, [tab, user])

  useEffect(() => { fetchNotes() }, [fetchNotes])

  useEffect(() => {
    const fetchLikes = async () => {
      if (notes.length === 0) return
      const { data } = await supabase.from('note_likes').select('note_id').eq('user_id', user.id)
      if (data) setLikedNotes(new Set(data.map(l => l.note_id)))
    }
    fetchLikes()
  }, [notes, user])

  const createNote = async () => {
    if (!form.title.trim()) return
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
    const { data } = await supabase.from('shared_notes').insert({ title: form.title.trim(), description: form.description, subject: form.subject, content: form.content, tags, visibility: form.visibility }).select().single()
    if (data) {
      addXp(15); unlockAchievement('shared_knowledge')
      setShowCreate(false); setForm({ title: '', description: '', subject: '', content: '', tags: '', visibility: 'public' })
      fetchNotes()
    }
  }

  const openNote = async (note) => {
    setActiveNote(note)
    const { data } = await supabase.from('note_comments').select('*, user:profiles!note_comments_user_id_fkey(username, avatar_emoji)').eq('note_id', note.id).order('created_at', { ascending: true })
    setComments(data || [])
  }

  const addComment = async () => {
    if (!newComment.trim() || !activeNote) return
    const { data } = await supabase.from('note_comments').insert({ note_id: activeNote.id, content: newComment.trim() }).select('*, user:profiles!note_comments_user_id_fkey(username, avatar_emoji)').single()
    if (data) { setComments([...comments, data]); setNewComment('') }
  }

  const toggleLike = async (note) => {
    if (likedNotes.has(note.id)) {
      await supabase.from('note_likes').delete().eq('note_id', note.id).eq('user_id', user.id)
      await supabase.from('shared_notes').update({ like_count: Math.max(0, note.like_count - 1) }).eq('id', note.id)
      setLikedNotes(prev => { const next = new Set(prev); next.delete(note.id); return next })
    } else {
      await supabase.from('note_likes').insert({ note_id: note.id })
      await supabase.from('shared_notes').update({ like_count: note.like_count + 1 }).eq('id', note.id)
      setLikedNotes(prev => new Set(prev).add(note.id))
      unlockAchievement('note_liked')
      pushNotification(note.user_id, 'note_like', 'Someone liked your note', `${profile?.username || 'Someone'} liked your note "${note.title}"`)
    }
    fetchNotes()
  }

  const duplicateNote = async (note) => {
    await supabase.from('shared_notes').update({ download_count: note.download_count + 1 }).eq('id', note.id)
    await supabase.from('notes').insert({ title: note.title, content: note.content, folder: 'Shared', subject_id: null })
    unlockAchievement('note_downloaded')
    refresh()
  }

  const deleteNote = async (id) => {
    await supabase.from('shared_notes').delete().eq('id', id); setActiveNote(null); fetchNotes()
  }

  if (activeNote) {
    return (
      <div className="sn-note-view">
        <button className="btn btn-ghost btn-sm" onClick={() => setActiveNote(null)}>← Back</button>
        <div className="sn-note-header">
          <div className="sn-note-author"><span className="sn-author-avatar" style={{ background: 'var(--primary)' }}>{activeNote.author?.avatar_emoji || '👤'}</span><span>{activeNote.author?.username || 'Unknown'}</span></div>
          <div className="sn-note-actions">
            <button className={`btn btn-sm ${likedNotes.has(activeNote.id) ? 'btn-primary' : 'btn-outline'}`} onClick={() => toggleLike(activeNote)}>❤️ {activeNote.like_count}</button>
            <button className="btn btn-outline btn-sm" onClick={() => duplicateNote(activeNote)}>📋 Duplicate</button>
            {activeNote.user_id === user.id && <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(activeNote.id)}>🗑 Delete</button>}
          </div>
        </div>
        <h1>{activeNote.title}</h1>
        {activeNote.description && <p className="sn-note-desc">{activeNote.description}</p>}
        <div className="sn-note-meta">
          {activeNote.subject && <span className="sn-meta-chip">📚 {activeNote.subject}</span>}
          {activeNote.tags?.map((t, i) => <span key={i} className="sn-meta-chip">#{t}</span>)}
          <span className="sn-meta-chip">⬇️ {activeNote.download_count} downloads</span>
        </div>
        <div className="sn-note-content">{activeNote.content || 'No content'}</div>
        <div className="sn-comments">
          <h3>Comments ({comments.length})</h3>
          <div className="sn-comment-input"><input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Write a comment..." onKeyDown={e => e.key === 'Enter' && addComment()} /><button className="btn btn-primary btn-sm" onClick={addComment}>Post</button></div>
          <div className="sn-comment-list">
            {comments.length === 0 ? <div className="dash-empty">No comments yet.</div> : comments.map(c => (
              <div key={c.id} className="sn-comment"><span className="sn-comment-avatar" style={{ background: 'var(--primary)' }}>{c.user?.avatar_emoji || '👤'}</span><div><span className="sn-comment-user">{c.user?.username || 'Unknown'}</span><p>{c.content}</p></div></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="sn-page">
      <div className="page-toolbar">
        <div><h2>Shared Notes</h2><p className="page-desc">Discover and share study notes with the community</p></div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>{showCreate ? 'Cancel' : '+ Share Note'}</button>
      </div>

      {showCreate && (
        <div className="form-card">
          <h3>Share a Note</h3>
          <div className="form-field"><label>Title</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Note title" /></div>
          <div className="form-field"><label>Description</label><input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Brief description" /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label><input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Biology" /></div>
            <div className="form-field"><label>Visibility</label><select value={form.visibility} onChange={e => setForm({ ...form, visibility: e.target.value })}><option value="public">Public</option><option value="friends">Friends Only</option><option value="private">Private</option></select></div>
          </div>
          <div className="form-field"><label>Content</label><textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your note content..." rows={6} /></div>
          <div className="form-field"><label>Tags (comma separated)</label><input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="exam, chapter 5, important" /></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={createNote}>Share Note</button></div>
        </div>
      )}

      <div className="sn-tabs">{['trending', 'recent', 'downloads', 'mine'].map(t => <button key={t} className={`sn-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}</div>

      {loading ? (
        <div className="card"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '20px auto' }} /></div>
      ) : notes.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📝</div><h3>No notes found</h3><p>{tab === 'mine' ? 'Share your first note!' : 'Check back later for new notes.'}</p></div>
      ) : (
        <div className="sn-grid">
          {notes.map(note => (
            <div key={note.id} className="sn-card" onClick={() => openNote(note)}>
              <div className="sn-card-header"><span className="sn-card-author"><span className="sn-card-avatar" style={{ background: 'var(--primary)' }}>{note.author?.avatar_emoji || '👤'}</span>{note.author?.username || 'Unknown'}</span>{note.subject && <span className="sn-card-subject">📚 {note.subject}</span>}</div>
              <h3>{note.title}</h3>
              {note.description && <p className="sn-card-desc">{note.description}</p>}
              <div className="sn-card-tags">{note.tags?.slice(0, 3).map((t, i) => <span key={i} className="sn-tag">#{t}</span>)}</div>
              <div className="sn-card-stats"><span>❤️ {note.like_count}</span><span>⬇️ {note.download_count}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
