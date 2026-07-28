import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, refresh } = useApp()
  const [activeId, setActiveId] = useState(null)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [draft, setDraft] = useState({})
  const saveTimer = useRef(null)

  const folders = useMemo(() => {
    const set = new Set(notes.map(n => n.folder).filter(Boolean))
    return ['all', 'pinned', ...Array.from(set)]
  }, [notes])

  const filtered = useMemo(() => {
    let list = notes
    if (folder === 'pinned') list = list.filter(n => n.pinned)
    else if (folder !== 'all') list = list.filter(n => n.folder === folder)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(n => (n.title?.toLowerCase().includes(q) || n.content?.toLowerCase().includes(q)))
    }
    return [...list].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))
  }, [notes, folder, search])

  const active = notes.find(n => n.id === activeId) || filtered[0] || null

  useEffect(() => {
    if (active) setDraft({ title: active.title || '', content: active.content || '', folder: active.folder || '', subject_id: active.subject_id || '', tags: active.tags || '' })
  }, [activeId, active?.id])

  const debouncedSave = (id, updates) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await supabase.from('notes').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id)
      refresh()
    }, 1500)
  }

  const updateDraft = (field, value) => {
    if (!active) return
    const newDraft = { ...draft, [field]: value }
    setDraft(newDraft)
    debouncedSave(active.id, { [field]: value })
  }

  const newNote = async () => {
    const { data: u } = await supabase.auth.getUser()
    const { data } = await supabase.from('notes').insert({ user_id: u.user.id, title: 'Untitled', content: '' }).select().single()
    if (data) { refresh(); setActiveId(data.id) }
  }

  const togglePin = async (n) => {
    await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id)
    refresh()
  }

  const toggleFav = async (n) => {
    await supabase.from('notes').update({ favorite: !n.favorite }).eq('id', n.id)
    refresh()
  }

  const deleteNote = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    if (activeId === id) setActiveId(null)
    refresh()
  }

  const getSubject = (id) => subjects.find(s => s.id === id)

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-search">
          <input placeholder="🔍 Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="notes-folders">
          {folders.map(f => (
            <button key={f} className={`folder-chip ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>
              {f === 'all' ? '📂 All' : f === 'pinned' ? '📌 Pinned' : `📁 ${f}`}
            </button>
          ))}
        </div>
        <button className="btn btn-primary notes-new" onClick={newNote}>+ New Note</button>
        <div className="notes-list">
          {filtered.length === 0 ? <div className="dash-empty">No notes found.</div> :
            filtered.map(n => (
              <div key={n.id} className={`note-item ${active?.id === n.id ? 'active' : ''}`} onClick={() => setActiveId(n.id)}>
                <div className="note-item-pin">{n.pinned && '📌'}</div>
                <div className="note-item-body">
                  <div className="note-item-title">{n.title || 'Untitled'}</div>
                  <div className="note-item-preview">{(n.content || '').slice(0, 60)}</div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="notes-editor">
        {active ? (
          <>
            <div className="editor-toolbar">
              <input className="editor-title" value={draft.title || ''} onChange={(e) => updateDraft('title', e.target.value)} placeholder="Note title" />
              <div className="editor-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => togglePin(active)}>{active.pinned ? '📌' : '📍'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(active)}>{active.favorite ? '⭐' : '☆'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => deleteNote(active.id)}>🗑️</button>
              </div>
            </div>
            <div className="editor-meta">
              <input className="editor-folder" value={draft.folder || ''} onChange={(e) => updateDraft('folder', e.target.value)} placeholder="Folder" />
              <select className="editor-subject" value={draft.subject_id || ''} onChange={(e) => updateDraft('subject_id', e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
              <input className="editor-tags" value={draft.tags || ''} onChange={(e) => updateDraft('tags', e.target.value)} placeholder="Tags (comma separated)" />
            </div>
            <textarea className="editor-content" value={draft.content || ''} onChange={(e) => updateDraft('content', e.target.value)} placeholder="Start writing..." />
            <div className="editor-save-indicator">Auto-saved</div>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📝</div>
            <h3>Select a note</h3>
            <p>Choose a note from the sidebar or create a new one.</p>
            <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}
