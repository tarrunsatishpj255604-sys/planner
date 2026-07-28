import { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, loading, refresh } = useApp()
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [activeId, setActiveId] = useState(null)
  const [draft, setDraft] = useState(null)
  const saveTimer = useRef(null)

  const folders = useMemo(() => {
    const set = new Set(notes.map(n => n.folder || 'General'))
    return ['all', ...Array.from(set)]
  }, [notes])

  const filtered = useMemo(() => {
    let list = notes
    if (folder !== 'all') list = list.filter(n => (n.folder || 'General') === folder)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
    }
    return list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))
  }, [notes, folder, search])

  const active = draft || notes.find(n => n.id === activeId)

  useEffect(() => {
    if (!activeId && filtered.length > 0) {
      const first = filtered[0]
      setActiveId(first.id)
      setDraft({ ...first })
    }
  }, [notes])

  useEffect(() => {
    if (activeId) {
      const n = notes.find(nn => nn.id === activeId)
      if (n) setDraft({ ...n })
    }
  }, [activeId])

  const selectNote = (id) => {
    setActiveId(id)
    const n = notes.find(nn => nn.id === id)
    if (n) setDraft({ ...n })
  }

  const update = (k, v) => {
    if (!draft) return
    setDraft(prev => ({ ...prev, [k]: v }))
  }

  // Auto-save debounced
  useEffect(() => {
    if (!draft || !draft.id) return
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      const { id, title, content, folder, subject_id, tags, pinned, favorite } = draft
      await supabase.from('notes').update({ title, content, folder, subject_id, tags, pinned, favorite, updated_at: new Date().toISOString() }).eq('id', id)
      refresh()
    }, 1500)
    return () => clearTimeout(saveTimer.current)
  }, [draft])

  const newNote = async () => {
    const { data } = await supabase.from('notes').insert({ title: 'Untitled', content: '', folder: 'General' }).select().single()
    if (data) { refresh(); setActiveId(data.id); setDraft({ ...data }) }
  }

  const togglePin = async () => {
    if (!active) return
    const newVal = !active.pinned
    setDraft(prev => ({ ...prev, pinned: newVal }))
    await supabase.from('notes').update({ pinned: newVal }).eq('id', active.id)
    refresh()
  }

  const toggleFav = async () => {
    if (!active) return
    const newVal = !active.favorite
    setDraft(prev => ({ ...prev, favorite: newVal }))
    await supabase.from('notes').update({ favorite: newVal }).eq('id', active.id)
    refresh()
  }

  const deleteNote = async () => {
    if (!active) return
    await supabase.from('notes').delete().eq('id', active.id)
    setActiveId(null); setDraft(null); refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="notes-sidebar-head">
          <button className="btn btn-primary notes-new-btn" onClick={newNote}>+ New Note</button>
          <input type="text" placeholder="🔍 Search notes..." value={search} onChange={e => setSearch(e.target.value)} className="notes-search" />
        </div>
        <div className="notes-folders">
          {folders.map(f => (
            <button key={f} className={`notes-folder-btn ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>
              {f === 'all' ? '📂 All Notes' : `📁 ${f}`}
            </button>
          ))}
        </div>
        <div className="notes-list">
          {filtered.length === 0 ? <div className="dash-empty" style={{ padding: '20px' }}>No notes found.</div> : filtered.map(n => (
            <button key={n.id} className={`notes-list-item ${activeId === n.id ? 'active' : ''}`} onClick={() => selectNote(n.id)}>
              {n.pinned && <span className="notes-pin-ind">📌</span>}
              <span className="notes-list-title">{n.title || 'Untitled'}</span>
              <span className="notes-list-preview">{(n.content || '').slice(0, 50)}</span>
              <span className="notes-list-date">{n.updated_at ? new Date(n.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {active ? (
          <>
            <div className="notes-editor-toolbar">
              <button className={`btn btn-ghost btn-sm ${active.pinned ? 'active-pin' : ''}`} onClick={togglePin}>📌 Pin</button>
              <button className={`btn btn-ghost btn-sm ${active.favorite ? 'active-fav' : ''}`} onClick={toggleFav}>❤️ Favorite</button>
              <button className="btn btn-ghost btn-sm notes-del-btn" onClick={deleteNote}>🗑️ Delete</button>
              <span className="notes-save-ind">Auto-saved</span>
            </div>
            <input type="text" className="notes-title-input" placeholder="Note title" value={draft?.title || ''} onChange={e => update('title', e.target.value)} />
            <div className="notes-meta-row">
              <input type="text" className="notes-folder-input" placeholder="Folder" value={draft?.folder || ''} onChange={e => update('folder', e.target.value)} />
              <select className="notes-subject-select" value={draft?.subject_id || ''} onChange={e => update('subject_id', e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input type="text" className="notes-tags-input" placeholder="Tags (comma separated)" value={draft?.tags || ''} onChange={e => update('tags', e.target.value)} />
            </div>
            <textarea className="notes-content-input" placeholder="Start writing..." value={draft?.content || ''} onChange={e => update('content', e.target.value)} />
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📝</div>
            <h3>No note selected</h3>
            <p>Create a new note or select one from the sidebar.</p>
            <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}
