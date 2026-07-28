import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/helpers.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, loading, refresh } = useApp()
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [noteFolder, setNoteFolder] = useState('General')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const saveTimer = useRef(null)
  const active = notes.find(n => n.id === activeId)

  useEffect(() => {
    if (active) {
      setTitle(active.title || ''); setContent(active.content || '')
      setNoteFolder(active.folder || 'General'); setSubjectId(active.subject_id || '')
      setTags(active.tags || '')
    } else { setTitle(''); setContent(''); setNoteFolder('General'); setSubjectId(''); setTags('') }
  }, [activeId, active?.id])

  const debouncedSave = useCallback(() => {
    if (!activeId) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('notes').update({ title, content, folder: noteFolder, subject_id: subjectId || null, tags, updated_at: new Date().toISOString() }).eq('id', activeId)
      refresh()
    }, 1500)
  }, [activeId, title, content, noteFolder, subjectId, tags, refresh])

  useEffect(() => { debouncedSave(); return () => clearTimeout(saveTimer.current) }, [debouncedSave])

  const newNote = async () => {
    const { data } = await supabase.from('notes').insert({ title: 'Untitled', content: '', folder: 'General' }).select().single()
    if (data) { refresh(); setActiveId(data.id) }
  }

  const delNote = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    if (activeId === id) setActiveId(null)
    refresh()
  }

  const togglePin = async (n) => { await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id); refresh() }
  const toggleFav = async (n) => { await supabase.from('notes').update({ favorite: !n.favorite }).eq('id', n.id); refresh() }

  const folders = ['all', ...new Set(notes.map(n => n.folder || 'General'))]
  const filtered = notes.filter(n => {
    if (folder !== 'all' && (n.folder || 'General') !== folder) return false
    if (search && !((n.title || '').toLowerCase().includes(search.toLowerCase()) || (n.content || '').toLowerCase().includes(search.toLowerCase()))) return false
    return true
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  if (loading) return <div className="notes-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-sidebar-head">
          <input className="notes-search" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} />
          <button className="btn btn-primary btn-sm notes-new" onClick={newNote}>+ New</button>
        </div>
        <div className="folder-filters">
          {folders.map(f => <button key={f} className={`filter-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>{f === 'all' ? 'All' : f}</button>)}
        </div>
        <div className="note-list">
          {filtered.length === 0 ? <div className="dash-empty" style={{ padding: '30px 12px' }}>No notes found.</div> : filtered.map(n => (
            <div key={n.id} className={`note-item ${activeId === n.id ? 'active' : ''}`} onClick={() => setActiveId(n.id)}>
              <div className="note-item-top">
                {n.pinned && <span className="note-pin">📌</span>}
                <span className="note-item-title">{n.title || 'Untitled'}</span>
              </div>
              <p className="note-item-preview">{(n.content || '').slice(0, 60) || 'No content'}</p>
              <div className="note-item-meta">
                <span className="note-folder">{n.folder || 'General'}</span>
                <span className="note-date">{formatDate(n.updated_at)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {active ? (
          <>
            <div className="editor-toolbar">
              <div className="editor-meta-row">
                <input className="editor-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Note title" />
                <div className="editor-actions">
                  <button className={`btn btn-ghost btn-sm ${active.favorite ? 'fav-active' : ''}`} onClick={() => toggleFav(active)}>{active.favorite ? '❤️' : '🤍'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => togglePin(active)}>{active.pinned ? '📌' : '📍'}</button>
                  <button className="btn btn-ghost btn-sm del-btn" onClick={() => delNote(active.id)}>Delete</button>
                </div>
              </div>
              <div className="editor-field-row">
                <input className="editor-folder-input" value={noteFolder} onChange={e => setNoteFolder(e.target.value)} placeholder="Folder" />
                <select className="editor-subject" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input className="editor-tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="tags, comma, separated" />
              </div>
            </div>
            <textarea className="editor-content" value={content} onChange={e => setContent(e.target.value)} placeholder="Start writing..." />
            <div className="editor-status">Auto-saved</div>
          </>
        ) : (
          <div className="empty-state" style={{ height: '100%' }}>
            <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📝</div>
            <h3>Select a note</h3><p>Or create a new one to get started.</p>
            <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}
