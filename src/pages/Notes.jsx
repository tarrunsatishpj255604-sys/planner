import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './NotesPage.css'

export default function Notes() {
  const { notes, subjects, refresh } = useApp()
  const [selected, setSelected] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [folder, setFolder] = useState('General')
  const [subjectId, setSubjectId] = useState('')
  const [tags, setTags] = useState('')
  const [search, setSearch] = useState('')
  const [filterFolder, setFilterFolder] = useState('all')
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const saveTimer = useRef(null)

  const folders = [...new Set(notes.map(n => n.folder))]

  const filtered = notes.filter(n => {
    if (filterFolder !== 'all' && n.folder !== filterFolder) return false
    if (search && !n.title.toLowerCase().includes(search.toLowerCase()) && !n.content.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || new Date(b.updated_at) - new Date(a.updated_at))

  const startNew = () => {
    setSelected(null); setTitle(''); setContent(''); setFolder('General')
    setSubjectId(''); setTags(''); setShowNew(true)
  }

  const startEdit = (n) => {
    setSelected(n); setTitle(n.title); setContent(n.content); setFolder(n.folder)
    setSubjectId(n.subject_id || ''); setTags((n.tags || []).join(', ')); setShowNew(false)
  }

  const save = useCallback(async (noteData) => {
    if (!noteData.title.trim() && !noteData.content.trim()) return
    setSaving(true)
    const tagArr = noteData.tags ? noteData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const payload = {
      title: noteData.title.trim() || 'Untitled', content: noteData.content,
      folder: noteData.folder, subject_id: noteData.subjectId || null,
      tags: tagArr, updated_at: new Date().toISOString(),
    }
    if (noteData.selected) {
      await supabase.from('notes').update(payload).eq('id', noteData.selected.id)
    } else {
      const { data } = await supabase.from('notes').insert({ ...payload, user_id: undefined }).select().single()
      if (data) setSelected(data)
    }
    setSaving(false)
    refresh()
  }, [refresh])

  const autoSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save({ selected, title, content, folder, subjectId, tags })
    }, 1500)
  }, [selected, title, content, folder, subjectId, tags, save])

  useEffect(() => {
    if (selected !== null && (title || content)) autoSave()
  }, [title, content, selected, autoSave])

  const handleNew = async () => {
    if (!title.trim() && !content.trim()) return
    setSaving(true)
    const tagArr = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []
    const { data } = await supabase.from('notes').insert({
      title: title.trim() || 'Untitled', content, folder,
      subject_id: subjectId || null, tags: tagArr,
    }).select().single()
    setSaving(false); setShowNew(false); refresh()
    if (data) startEdit(data)
  }

  const togglePin = async (n) => {
    await supabase.from('notes').update({ pinned: !n.pinned }).eq('id', n.id); refresh()
  }

  const toggleFav = async (n) => {
    await supabase.from('notes').update({ favorite: !n.favorite }).eq('id', n.id); refresh()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return
    await supabase.from('notes').delete().eq('id', id)
    if (selected?.id === id) { setSelected(null); setTitle(''); setContent('') }
    refresh()
  }

  return (
    <div className="notes-page">
      <div className="notes-sidebar">
        <div className="ns-toolbar">
          <input type="text" placeholder="Search notes…" value={search} onChange={e => setSearch(e.target.value)} className="ns-search" />
          <button className="btn btn-primary btn-sm" onClick={startNew}>+ New</button>
        </div>
        <div className="ns-folders">
          <button className={`ns-folder ${filterFolder === 'all' ? 'active' : ''}`} onClick={() => setFilterFolder('all')}>All Notes ({notes.length})</button>
          {folders.map(f => (
            <button key={f} className={`ns-folder ${filterFolder === f ? 'active' : ''}`} onClick={() => setFilterFolder(f)}>{f} ({notes.filter(n => n.folder === f).length})</button>
          ))}
        </div>
        <div className="ns-list">
          {filtered.length === 0 ? (
            <p className="dash-empty">No notes found. Create one!</p>
          ) : filtered.map(n => (
            <div key={n.id} className={`ns-item ${selected?.id === n.id ? 'active' : ''}`} onClick={() => startEdit(n)}>
              {n.pinned && <span className="ns-pin">📌</span>}
              <span className="ns-item-title">{n.title}</span>
              <span className="ns-item-preview">{n.content.substring(0, 60)}</span>
              <span className="ns-item-meta">{n.folder} · {new Date(n.updated_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="notes-editor">
        {showNew ? (
          <>
            <div className="ne-head">
              <input type="text" placeholder="Note title" value={title} onChange={e => setTitle(e.target.value)} className="ne-title" autoFocus />
              <button className="btn btn-primary btn-sm" onClick={handleNew} disabled={saving}>{saving ? 'Saving…' : 'Create'}</button>
            </div>
            <div className="ne-meta">
              <input type="text" placeholder="Folder" value={folder} onChange={e => setFolder(e.target.value)} className="ne-meta-input" />
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="ne-meta-input">
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
              <input type="text" placeholder="Tags (comma separated)" value={tags} onChange={e => setTags(e.target.value)} className="ne-meta-input" />
            </div>
            <textarea placeholder="Start writing… (Markdown supported)" value={content} onChange={e => setContent(e.target.value)} className="ne-content" />
          </>
        ) : selected ? (
          <>
            <div className="ne-head">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="ne-title" />
              <div className="ne-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => togglePin(selected)} title="Pin">{selected.pinned ? '📌' : '📍'}</button>
                <button className="btn btn-ghost btn-sm" onClick={() => toggleFav(selected)} title="Favorite">{selected.favorite ? '⭐' : '☆'}</button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(selected.id)}>Delete</button>
                {saving && <span className="ne-saving">Saving…</span>}
              </div>
            </div>
            <div className="ne-meta">
              <input type="text" value={folder} onChange={e => setFolder(e.target.value)} className="ne-meta-input" />
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="ne-meta-input">
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="Tags" className="ne-meta-input" />
            </div>
            <textarea value={content} onChange={e => setContent(e.target.value)} className="ne-content" />
          </>
        ) : (
          <div className="ne-empty">
            <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg>
            </div>
            <h3>Select or create a note</h3>
            <p>Click a note on the left to edit it, or create a new one.</p>
            <button className="btn btn-primary" onClick={startNew}>+ New Note</button>
          </div>
        )}
      </div>
    </div>
  )
}
