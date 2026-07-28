import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, PRIORITY_CONFIG, DIFFICULTY_CONFIG } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { subjects, tasks, refresh, addXp } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [difficulty, setDifficulty] = useState('medium')
  const [filter, setFilter] = useState('all')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setTitle(''); setDescription(''); setSubjectId(''); setDueDate('')
    setPriority('medium'); setDifficulty('medium'); setEditing(null); setError(''); setShowForm(false)
  }

  const startEdit = (t) => {
    setEditing(t); setTitle(t.title); setDescription(t.description || '')
    setSubjectId(t.subject_id || ''); setDueDate(t.due_date || '')
    setPriority(t.priority); setDifficulty(t.difficulty); setShowForm(true); setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Task title is required.'); return }
    setSaving(true)
    const payload = {
      title: title.trim(), description: description.trim() || null,
      subject_id: subjectId || null, due_date: dueDate || null,
      priority, difficulty,
    }
    if (editing) {
      const { error } = await supabase.from('tasks').update(payload).eq('id', editing.id)
      if (error) { setError(error.message); setSaving(false); return }
    } else {
      const { error } = await supabase.from('tasks').insert(payload)
      if (error) { setError(error.message); setSaving(false); return }
    }
    reset(); refresh()
  }

  const toggleComplete = async (t) => {
    await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id)
    if (!t.completed) await addXp(DIFFICULTY_CONFIG[t.difficulty]?.xp || 20)
    refresh()
  }

  const toggleArchive = async (t) => {
    await supabase.from('tasks').update({ archived: !t.archived }).eq('id', t.id)
    refresh()
  }

  const handleDelete = async (id) => {
    await supabase.from('tasks').delete().eq('id', id); refresh()
  }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed && !t.archived
    if (filter === 'completed') return t.completed && !t.archived
    if (filter === 'archived') return t.archived
    return !t.archived
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1; if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <p className="page-desc">Track assignments with priority, difficulty, due dates, and subject tags.</p>
        {!showForm && <button className="btn btn-primary btn-sm" onClick={() => { reset(); setShowForm(true) }}>Add task</button>}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-head">
            <h3>{editing ? 'Edit task' : 'New Task'}</h3>
            <button type="button" className="close-btn" onClick={reset}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-field">
            <label>Task title</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Chapter 5 homework" autoFocus disabled={saving} />
          </div>
          <div className="form-field">
            <label>Description (optional)</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add details…" rows={2} disabled={saving} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={saving}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} disabled={saving} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Priority</label>
              <div className="seg-pick">
                {Object.entries(PRIORITY_CONFIG).map(([k, p]) => (
                  <button key={k} type="button" className={`seg-btn ${priority === k ? 'sel' : ''}`} style={priority === k ? { background: p.bg, color: p.color, borderColor: p.color } : {}} onClick={() => setPriority(k)}>{p.label}</button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <div className="seg-pick">
                {Object.entries(DIFFICULTY_CONFIG).map(([k, d]) => (
                  <button key={k} type="button" className={`seg-btn ${difficulty === k ? 'sel' : ''}`} style={difficulty === k ? { background: d.bg, color: d.color, borderColor: d.color } : {}} onClick={() => setDifficulty(k)}>{d.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>{saving && <span className="spinner" />}{saving ? 'Saving…' : (editing ? 'Save' : 'Add task')}</button>
          </div>
        </form>
      )}

      <div className="task-filters">
        {['all', 'pending', 'completed', 'archived'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="fc-count">
              {f === 'all' ? tasks.filter(t => !t.archived).length :
               f === 'pending' ? tasks.filter(t => !t.completed && !t.archived).length :
               f === 'completed' ? tasks.filter(t => t.completed && !t.archived).length :
               tasks.filter(t => t.archived).length}
            </span>
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <h3>No tasks here</h3>
          <p>{filter === 'all' ? 'Add your first task to get started.' : 'Nothing in this filter yet.'}</p>
        </div>
      ) : (
        <div className="task-list-full">
          {sorted.map(t => {
            const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
            const dc = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG.medium
            const overdue = t.due_date && !t.completed && new Date(t.due_date) < new Date(new Date().setHours(0,0,0,0))
            return (
              <div key={t.id} className={`task-row-full ${t.completed ? 'done' : ''}`}>
                <button className="task-check-lg" onClick={() => toggleComplete(t)} style={t.completed ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}}>
                  {t.completed && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </button>
                <div className="task-info-full">
                  <span className="task-title-full">{t.title}</span>
                  {t.description && <span className="task-desc-full">{t.description}</span>}
                  <div className="task-meta-full">
                    {t.subject && <span className="tm-chip" style={{ background: `${t.subject.color}15`, color: t.subject.color }}><span className="tm-dot" style={{ background: t.subject.color }} />{t.subject.name}</span>}
                    <span className="tm-chip" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    <span className="tm-chip" style={{ background: dc.bg, color: dc.color }}>{dc.label}</span>
                    {t.due_date && <span className="tm-due" style={{ color: overdue ? 'var(--error)' : 'var(--text-3)' }}>{formatDate(t.due_date)}</span>}
                  </div>
                </div>
                <div className="task-actions-full">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)} title="Edit"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleArchive(t)} title={t.archived ? 'Unarchive' : 'Archive'}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></svg></button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(t.id)} title="Delete"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
