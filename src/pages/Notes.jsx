import { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/helpers.js'
import './NotesPage.css'

const FOLDERS = ['all', 'personal', 'study', 'ideas', 'archive']

export default function Notes() {
  const { user, notes, subjects, refresh } = useApp()
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteFolder, setNoteFolder] = useState('personal')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const saveTimer = useRef(null)

  const active = notes.find(n => n.id === activeId)

  const filtered = useMemo(() => {
    return notes.filter(n => {
      if (folder !== 'all' && n.folder !== folder) return false
      if (search) { const q = search.toLowerCase(); return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q) }
      return true
    }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))
  }, [notes, folder, search])

  useEffect(() => {
    if (active) {
      setTitle(active.title || ''); setContent(active.content || ''); setNoteFolder(active.folder || 'personal')
      setSubjectId(active.subject_id || ''); setTags((active.tags || []).join(', '))
    }
  }, [activeId, active?.updated_at])

  useEffect(() => {
    if (!activeId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean)
      await supabase.from('notes').update({ title, content, folder: noteFolder, subject_id: subjectId || null, tags: tagArr, updated_at: new Date().toISOString() }).eq('id', activeId)
      refresh()
    }, 1500)
    return () => saveTimer.current && clearTimeout(saveTimer.current)
  }, [title, content, noteFolder, subjectId, tags, activeId])

  const newNote = async () => {
    const { data } = await supabase.from('notes').insert({ user_id: user.id, title: 'Untitled', content: '', folder: 'personal', tags: [] }).select().single()
    if (data) { setActiveId(data.id); setTitle('Untitled'); setContent(''); setNoteFolder('personal'); setSubjectId(''); setTags(''); refresh() }
  }

  const togglePin = async (n) => { await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id); refresh() }
  const toggleFav = async (n) => { await supabase.from('notes').update({ favorite: !n.favorite }).eq('id', n.id); refresh() }
  const deleteNote = async (n) => { if (!confirm('Delete this note?')) return; await supabase.from('notes').delete().eq('id', n.id); if (activeId === n.id) setActiveId(null); refresh() }

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-search">
          <input type="text" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="notes-folders">
          {FOLDERS.map(f => <button key={f} className={`folder-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>)}
        </div>
        <button className="btn btn-primary notes-new" onClick={newNote}>+ New Note</button>
        <div className="notes-list">
          {filtered.length === 0 ? <p className="dash-empty">No notes found.</p> : filtered.map(n => (
            <div key={n.id} className={`note-item ${activeId === n.id ? 'active' : ''}`} onClick={() => setActiveId(n.id)}>
              <div className="note-item-top">
                {n.pinned && <span className="note-pin">📌</span>}
                <span className="note-item-title">{n.title || 'Untitled'}</span>
                {n.favorite && <span className="note-fav">⭐</span>}
              </div>
              <span className="note-item-preview">{(n.content || '').slice(0, 60) || 'No content'}</span>
              <span className="note-item-date">{formatDate(n.updated_at)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {active ? (
          <>
            <div className="notes-editor-toolbar">
              <div className="form-row" style={{ flex: 1 }}>
                <div className="form-field">
                  <label>Folder</label>
                  <select value={noteFolder} onChange={e => setNoteFolder(e.target.value)}>
                    {FOLDERS.filter(f => f !== 'all').map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Subject</label>
                  <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                    <option value="">No subject</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>
                <div className="form-field">
                  <label>Tags (comma separated)</label>
                  <input type="text" placeholder="tag1, tag2" value={tags} onChange={e => setTags(e.target.value)} />
                </div>
              </div>
              <div className="notes-editor-actions">
                <button className="btn btn-sm btn-ghost" onClick={() => togglePin(active)}>{active.pinned ? '📌 Unpin' : '📌 Pin'}</button>
                <button className="btn btn-sm btn-ghost" onClick={() => toggleFav(active)}>{active.favorite ? '⭐ Unstar' : '☆ Star'}</button>
                <button className="btn btn-sm btn-ghost" onClick={() => deleteNote(active)}>🗑️ Delete</button>
              </div>
            </div>
            <input className="notes-title-input" placeholder="Note title..." value={title} onChange={e => setTitle(e.target.value)} />
            <textarea className="notes-content" placeholder="Start writing..." value={content} onChange={e => setContent(e.target.value)} />
            <div className="notes-save-indicator">Auto-saved</div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📝</div>
            <h3>No note selected</h3>
            <p>Select a note from the list or create a new one.</p>
            <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}
