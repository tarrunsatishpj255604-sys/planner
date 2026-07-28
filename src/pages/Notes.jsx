import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, refresh } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteFolder, setNoteFolder] = useState('General')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const [saveTimer, setSaveTimer] = useState(null)

  const selected = notes.find(n => n.id === selectedId)
  const folders = ['all', ...new Set(notes.map(n => n.folder || 'General').filter(Boolean))]

  useEffect(() => {
    if (selected) { setTitle(selected.title || ''); setContent(selected.content || ''); setNoteFolder(selected.folder || 'General'); setSubjectId(selected.subject_id || ''); setTags((selected.tags || []).join(', ')) }
  }, [selectedId, selected?.id])

  const filtered = notes.filter(n => {
    if (folder !== 'all' && (n.folder || 'General') !== folder) return false
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase()) && !n.content?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const createNote = async () => {
    const { data } = await supabase.from('notes').insert({ title: 'Untitled', content: '', folder: 'General' }).select().single()
    if (data) { setSelectedId(data.id); refresh() }
  }

  const saveNote = useCallback(() => {
    if (!selectedId) return
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean)
    supabase.from('notes').update({ title, content, folder: noteFolder, subject_id: subjectId || null, tags: tagArray, updated_at: new Date().toISOString() }).eq('id', selectedId).then(() => refresh())
  }, [selectedId, title, content, noteFolder, subjectId, tags])

  const debouncedSave = useCallback(() => { if (saveTimer) clearTimeout(saveTimer); const t = setTimeout(saveNote, 1500); setSaveTimer(t) }, [saveNote, saveTimer])

  useEffect(() => { if (selectedId) debouncedSave() }, [title, content, noteFolder, subjectId, tags])

  const togglePin = async (note) => { await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id); refresh() }
  const toggleFav = async (note) => { await supabase.from('notes').update({ favorite: !note.favorite }).eq('id', note.id); refresh() }
  const deleteNote = async (id) => { await supabase.from('notes').delete().eq('id', id); if (selectedId === id) setSelectedId(null); refresh() }

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-search-row"><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes..." /><button className="btn btn-primary btn-sm" onClick={createNote}>+ New</button></div>
        <div className="notes-folders">{folders.map(f => <button key={f} className={`folder-btn ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f === 'all' ? 'All Notes' : f}</button>)}</div>
        <div className="notes-list">
          {filtered.length === 0 ? <div className="dash-empty" style={{ padding: 20 }}>No notes found.</div> : filtered.map(n => (
            <div key={n.id} className={`note-item ${selectedId === n.id ? 'active' : ''} ${n.pinned ? 'pinned' : ''}`} onClick={() => setSelectedId(n.id)}>
              <div className="note-item-top">{n.pinned && <span className="pin-icon">📌</span>}<span className="note-item-title">{n.title || 'Untitled'}</span>}{n.favorite && <span className="fav-icon">❤️</span>}</div>
              <p className="note-item-preview">{n.content || 'No content...'}</p>
              <span className="note-item-folder">{n.folder || 'General'}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="notes-editor">
        {selected ? (
          <div className="editor-content">
            <div className="editor-toolbar">
              <button className="btn btn-ghost btn-sm" onClick={() => togglePin(selected)}>{selected.pinned ? '📌 Unpin' : '📌 Pin'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(selected)}>{selected.favorite ? '❤️ Unfavorite' : '❤️ Favorite'}</button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(selected.id)}>🗑 Delete</button>
            </div>
            <input className="editor-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title..." />
            <div className="editor-meta-row">
              <input className="editor-folder-input" value={noteFolder} onChange={e => setNoteFolder(e.target.value)} placeholder="Folder" />
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
              <input value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags (comma separated)" />
            </div>
            <textarea className="editor-textarea" value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." />
            <div className="save-indicator">Auto-saves as you type</div>
          </div>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📝</div><h3>Select a note</h3><p>Choose a note from the list or create a new one.</p><button className="btn btn-primary" onClick={createNote}>New Note</button></div>
        )}
      </div>
    </div>
  )
}
