import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/helpers.js'
import './NotesPage.css'

const FOLDERS = ['General', 'Study', 'Personal', 'Ideas', 'Archive']

export default function Notes() {
  const { notes, subjects, loading, refresh, unlockAchievement } = useApp()
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteFolder, setNoteFolder] = useState('General')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const saveTimerRef = useRef(null)

  const selected = notes.find(n => n.id === selectedId)

  useEffect(() => {
    if (selected) {
      setTitle(selected.title || '')
      setContent(selected.content || '')
      setNoteFolder(selected.folder || 'General')
      setSubjectId(selected.subject_id || '')
      setTags(selected.tags || '')
    }
  }, [selectedId])

  const filtered = notes.filter(n => {
    if (folder !== 'All' && n.folder !== folder) return false
    if (search && !n.title?.toLowerCase().includes(search.toLowerCase()) && !n.content?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const newNote = async () => {
    const { data, error } = await supabase.from('notes').insert({ title: 'Untitled', content: '', folder: 'General' }).select().single()
    if (!error && data) {
      if (notes.length === 0) await unlockAchievement('notes_5')
      refresh()
      setSelectedId(data.id)
      setTitle('Untitled'); setContent(''); setNoteFolder('General'); setSubjectId(''); setTags('')
    }
  }

  const saveNote = useCallback(async () => {
    if (!selectedId || saving) return
    setSaving(true)
    await supabase.from('notes').update({
      title: title || 'Untitled',
      content,
      folder: noteFolder,
      subject_id: subjectId || null,
      tags: tags || null,
      updated_at: new Date().toISOString(),
    }).eq('id', selectedId)
    refresh()
    setSaving(false)
  }, [selectedId, title, content, noteFolder, subjectId, tags, saving])

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNote(), 1500)
  }, [saveNote])

  useEffect(() => {
    if (selectedId && selected) {
      debouncedSave()
    }
  }, [title, content, noteFolder, subjectId, tags])

  const togglePin = async (note) => {
    await supabase.from('notes').update({ pinned: !note.pinned }).eq('id', note.id)
    refresh()
  }
  const toggleFav = async (note) => {
    await supabase.from('notes').update({ favorite: !note.favorite }).eq('id', note.id)
    refresh()
  }
  const del = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    if (selectedId === id) setSelectedId(null)
    refresh()
  }

  const getPreview = (note) => {
    const text = note.content || ''
    return text.slice(0, 60) || 'No content'
  }

  const sortedNotes = [...filtered].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1
    if (!a.pinned && b.pinned) return 1
    return new Date(b.updated_at) - new Date(a.updated_at)
  })

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="notes-page">
      <div className="page-toolbar">
        <div><h2>Notes</h2><p className="page-desc">Organize your notes with folders, tags, and subjects. Auto-saves as you type.</p></div>
        <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
      </div>

      <div className="notes-layout">
        <aside className="notes-sidebar">
          <input type="text" className="notes-search" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="folder-filters">
            <button className={`folder-chip ${folder === 'All' ? 'active' : ''}`} onClick={() => setFolder('All')}>All</button>
            {FOLDERS.map(f => (
              <button key={f} className={`folder-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f}</button>
            ))}
          </div>
          <div className="note-list">
            {sortedNotes.length === 0 ? (
              <div className="dash-empty" style={{ padding: '20px' }}>No notes found.</div>
            ) : sortedNotes.map(note => (
              <div key={note.id} className={`note-list-item ${selectedId === note.id ? 'selected' : ''}`} onClick={() => setSelectedId(note.id)}>
                <div className="nli-header">
                  {note.pinned && <span className="nli-pin">📌</span>}
                  <span className="nli-title">{note.title || 'Untitled'}</span>
                  {note.favorite && <span className="nli-fav">❤️</span>}
                </div>
                <p className="nli-preview">{getPreview(note)}</p>
                <div className="nli-meta">
                  <span className="nli-folder">{note.folder || 'General'}</span>
                  <span className="nli-date">{formatDate(note.updated_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="notes-editor">
          {!selected ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)', fontSize: 28 }}>📝</div>
              <h3>Select a note or create one</h3>
              <p>Choose a note from the sidebar or click "New Note" to get started.</p>
              <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
            </div>
          ) : (
            <div className="editor-content">
              <div className="editor-top-bar">
                <input type="text" className="editor-title" placeholder="Note title..." value={title} onChange={e => setTitle(e.target.value)} />
                <div className="editor-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => togglePin(selected)}>{selected.pinned ? '📌' : '📍'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(selected)}>{selected.favorite ? '❤️' : '🤍'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => del(selected.id)}>🗑️</button>
                </div>
              </div>
              <div className="editor-meta-row">
                <select className="editor-folder-select" value={noteFolder} onChange={e => setNoteFolder(e.target.value)}>
                  {FOLDERS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <select className="editor-subject-select" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <input type="text" className="editor-tags" placeholder="tag1, tag2..." value={tags} onChange={e => setTags(e.target.value)} />
                <span className="save-status">{saving ? 'Saving...' : '✓ Saved'}</span>
              </div>
              <textarea className="editor-textarea" placeholder="Start writing..." value={content} onChange={e => setContent(e.target.value)} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
