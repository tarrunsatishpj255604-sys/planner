import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/helpers.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, refresh, loading } = useApp()
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [selectedId, setSelectedId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteSubject, setNoteSubject] = useState('')
  const [noteFolder, setNoteFolder] = useState('general')
  const [tags, setTags] = useState('')
  const [pinned, setPinned] = useState(false)
  const [favorite, setFavorite] = useState(false)
  const saveTimer = useRef(null)

  const folders = useMemo(() => {
    const set = new Set(['general'])
    ;(notes || []).forEach(n => { if (n.folder) set.add(n.folder) })
    return ['all', ...Array.from(set)]
  }, [notes])

  const filteredNotes = useMemo(() => {
    let list = notes || []
    if (folder !== 'all') list = list.filter(n => (n.folder || 'general') === folder)
    if (search.trim()) { const q = search.toLowerCase(); list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q)) }
    return [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
  }, [notes, folder, search])

  const selected = (notes || []).find(n => n.id === selectedId)

  const selectNote = (note) => {
    setSelectedId(note.id)
    setTitle(note.title || '')
    setContent(note.content || '')
    setNoteSubject(note.subject_id || '')
    setNoteFolder(note.folder || 'general')
    setTags(note.tags || '')
    setPinned(!!note.pinned)
    setFavorite(!!note.favorite)
  }

  const newNote = async () => {
    const { data, error } = await supabase.from('notes').insert({ title: 'Untitled', content: '', folder: 'general' }).select().single()
    if (!error && data) { refresh(); selectNote(data); setSelectedId(data.id) }
  }

  const save = useCallback(async () => {
    if (!selectedId) return
    await supabase.from('notes').update({ title, content, subject_id: noteSubject || null, folder: noteFolder, tags, pinned, favorite, updated_at: new Date().toISOString() }).eq('id', selectedId)
    refresh()
  }, [selectedId, title, content, noteSubject, noteFolder, tags, pinned, favorite, refresh])

  useEffect(() => {
    if (!selectedId) return
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => { save() }, 1500)
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current) }
  }, [title, content, noteSubject, noteFolder, tags, pinned, favorite, selectedId, save])

  const togglePin = async () => { setPinned(!pinned) }
  const toggleFavorite = async () => { setFavorite(!favorite) }
  const deleteNote = async () => {
    if (!selectedId) return
    await supabase.from('notes').delete().eq('id', selectedId)
    setSelectedId(null); setTitle(''); setContent(''); refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-search">
          <input type="text" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="notes-folders">
          {folders.map(f => <button key={f} className={`filter-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f === 'all' ? '📂 All' : `📁 ${f}`}</button>)}
        </div>
        <button className="btn btn-primary notes-new" onClick={newNote}>+ New Note</button>
        <div className="notes-list">
          {filteredNotes.length === 0 ? <div className="dash-empty">No notes found.</div> : filteredNotes.map(n => (
            <div key={n.id} className={`note-list-item ${selectedId === n.id ? 'active' : ''}`} onClick={() => selectNote(n)}>
              {n.pinned && <span className="note-pin">📌</span>}
              <div className="note-list-info">
                <span className="note-list-title">{n.title || 'Untitled'}</span>
                <span className="note-list-preview">{(n.content || '').slice(0, 50) || 'No content...'}</span>
                <span className="note-list-date">{formatDate(n.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {selected ? (
          <>
            <div className="notes-editor-toolbar">
              <button className="btn btn-ghost btn-sm" onClick={togglePin}>{pinned ? '📌 Unpin' : '📌 Pin'}</button>
              <button className="btn btn-ghost btn-sm" onClick={toggleFavorite}>{favorite ? '★ Unfavorite' : '☆ Favorite'}</button>
              <button className="btn btn-ghost btn-sm" onClick={deleteNote}>🗑️ Delete</button>
              <span className="notes-save-status">Auto-saved</span>
            </div>
            <input className="notes-title-input" type="text" placeholder="Note title" value={title} onChange={e => setTitle(e.target.value)} />
            <div className="notes-meta-row">
              <select value={noteFolder} onChange={e => setNoteFolder(e.target.value)}><option value="general">General</option><option value="study">Study</option><option value="ideas">Ideas</option><option value="todo">Todo</option></select>
              <select value={noteSubject} onChange={e => setNoteSubject(e.target.value)}><option value="">No subject</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select>
              <input type="text" placeholder="tags, comma, separated" value={tags} onChange={e => setTags(e.target.value)} />
            </div>
            <textarea className="notes-content" placeholder="Start writing..." value={content} onChange={e => setContent(e.target.value)} />
          </>
        ) : (
          <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)' }}>📝</div><h3>No note selected</h3><p>Select a note from the sidebar or create a new one.</p><button className="btn btn-primary" onClick={newNote}>+ New Note</button></div>
        )}
      </div>
    </div>
  )
}
