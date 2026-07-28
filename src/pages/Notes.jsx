import { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate } from '../lib/helpers.js'
import './NotesPage.css'

export default function Notes() {
  const { user, notes, subjects, refresh } = useApp()
  const [selectedId, setSelectedId] = useState(null)
  const [search, setSearch] = useState('')
  const [folder, setFolder] = useState('all')
  const [title, setTitle] = useState('')
  const [noteFolder, setNoteFolder] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)
  const saveTimer = useRef(null)

  const folders = useMemo(() => {
    const set = new Set(notes.map(n => n.folder).filter(Boolean))
    return ['all', ...Array.from(set)]
  }, [notes])

  const filtered = useMemo(() => {
    let list = [...notes].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))
    if (folder !== 'all') list = list.filter(n => n.folder === folder)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(n => (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q))
    }
    return list
  }, [notes, folder, search])

  const selected = notes.find(n => n.id === selectedId)

  useEffect(() => {
    if (selected) {
      setTitle(selected.title || '')
      setNoteFolder(selected.folder || '')
      setSubjectId(selected.subject_id || '')
      setTags((selected.tags || []).join(', '))
      setContent(selected.content || '')
    }
  }, [selectedId, selected?.updated_at])

  const newNote = async () => {
    setBusy(true)
    const { data } = await supabase.from('notes').insert({
      user_id: user.id, title: 'Untitled', content: '', folder: null, subject_id: null, tags: [],
    }).select().single()
    if (data) { refresh(); setSelectedId(data.id) }
    setBusy(false)
  }

  const save = async (id, patch) => {
    await supabase.from('notes').update(patch).eq('id', id)
    refresh()
  }

  const debouncedSave = (id, patch) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => save(id, patch), 1500)
  }

  const onField = (setter, field) => (e) => {
    const val = e.target.value
    setter(val)
    if (selectedId) {
      const patch = { [field]: field === 'tags' ? val.split(',').map(t => t.trim()).filter(Boolean) : val, updated_at: new Date().toISOString() }
      debouncedSave(selectedId, patch)
    }
  }

  const togglePin = async (n) => { await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id); refresh() }
  const toggleFav = async (n) => { await supabase.from('notes').update({ favorited: !n.favorited }).eq('id', n.id); refresh() }
  const remove = async (id) => {
    await supabase.from('notes').delete().eq('id', id)
    if (selectedId === id) setSelectedId(null)
    refresh()
  }

  return (
    <div className="notes-page">
      <div className="notes-layout">
        <aside className="notes-sidebar">
          <div className="notes-toolbar">
            <button className="btn btn-primary notes-new" onClick={newNote} disabled={busy}>+ New Note</button>
            <input className="notes-search" placeholder="🔍 Search notes..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="notes-folders">
            {folders.map(f => (
              <button key={f} className={`notes-folder ${folder === f ? 'active' : ''}`} onClick={() => setFolder(f)}>
                {f === 'all' ? '📁 All Notes' : `📁 ${f}`}
              </button>
            ))}
          </div>
          <div className="notes-list">
            {filtered.length === 0 && <p className="dash-empty">No notes found.</p>}
            {filtered.map(n => (
              <button key={n.id} className={`notes-list-item ${selectedId === n.id ? 'active' : ''}`} onClick={() => setSelectedId(n.id)}>
                {n.pinned && <span className="notes-pin">📌</span>}
                <div className="notes-item-body">
                  <span className="notes-item-title">{n.title || 'Untitled'}</span>
                  <span className="notes-item-preview">{(n.content || '').slice(0, 60) || 'No content'}</span>
                  <span className="notes-item-meta">
                    {n.folder && <span>{n.folder}</span>}
                    <span>{formatDate(n.updated_at?.split('T')[0] || n.created_at?.split('T')[0])}</span>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <section className="notes-editor">
          {selected ? (
            <>
              <div className="notes-editor-head">
                <input className="notes-title-input" placeholder="Note title" value={title} onChange={onField(setTitle, 'title')} />
                <div className="notes-editor-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => togglePin(selected)} title="Pin">
                    {selected.pinned ? '📌' : '📍'}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(selected)} title="Favorite">
                    {selected.favorited ? '⭐' : '☆'}
                  </button>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(selected.id)} title="Delete">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
              <div className="notes-editor-meta">
                <input className="notes-folder-input" placeholder="Folder" value={noteFolder} onChange={onField(setNoteFolder, 'folder')} />
                <select className="notes-subject-select" value={subjectId} onChange={onField(setSubjectId, 'subject_id')}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
                <input className="notes-tags-input" placeholder="Tags (comma separated)" value={tags} onChange={onField(setTags, 'tags')} />
              </div>
              <textarea className="notes-content" placeholder="Start writing..." value={content} onChange={onField(setContent, 'content')} />
              <span className="notes-save-hint">Auto-saves as you type</span>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: '#f3e8ff', color: '#8b5cf6' }}>📝</div>
              <h3>Select a note</h3>
              <p>Choose a note from the sidebar or create a new one.</p>
              <button className="btn btn-primary" onClick={newNote}>+ New Note</button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
