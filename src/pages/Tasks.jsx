import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './Tasks.css'

const PRIORITY = {
  high: { label: 'High', color: 'var(--error)', bg: 'var(--error-l)' },
  medium: { label: 'Medium', color: 'var(--warning)', bg: 'var(--warning-l)' },
  low: { label: 'Low', color: 'var(--success)', bg: 'var(--success-l)' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Tasks({ subjects, tasks, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  const resetForm = () => {
    setTitle(''); setDescription(''); setSubjectId('')
    setDueDate(''); setPriority('medium'); setEditing(null)
    setError(''); setShowForm(false)
  }

  const startEdit = (t) => {
    setEditing(t)
    setTitle(t.title)
    setDescription(t.description || '')
    setSubjectId(t.subject_id || '')
    setDueDate(t.due_date || '')
    setPriority(t.priority || 'medium')
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) { setError('Task title is required.'); return }
    if (subjects.length > 0 && !subjectId) { setError('Please choose a subject.'); return }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        subject_id: subjectId || null,
        due_date: dueDate || null,
        priority,
      }
      if (editing) {
        const { error } = await supabase.from('tasks').update(payload).eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('tasks').insert(payload)
        if (error) throw error
      }
      resetForm()
      onRefresh()
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleComplete = async (t) => {
    try {
      await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id)
      onRefresh()
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return
    try {
      await supabase.from('tasks').delete().eq('id', id)
      onRefresh()
    } catch {
      // ignore
    }
  }

  const filtered = tasks.filter((t) => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    if (!a.due_date && !b.due_date) return 0
    if (!a.due_date) return 1
    if (!b.due_date) return -1
    return new Date(a.due_date) - new Date(b.due_date)
  })

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <p className="page-desc">Track assignments, exams, and deadlines. Mark tasks as done when you finish them.</p>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true) }} disabled={subjects.length === 0}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add task
          </button>
        )}
      </div>

      {subjects.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <h3>Add a subject first</h3>
          <p>You need at least one subject before you can create tasks.</p>
        </div>
      )}

      {showForm && subjects.length > 0 && (
        <form className="task-form" onSubmit={handleSubmit}>
          <div className="sf-head">
            <h3>{editing ? 'Edit task' : 'New task'}</h3>
            <button type="button" className="auth-close" onClick={resetForm}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="sf-field">
            <label>Task title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 5 homework"
              autoFocus
              disabled={saving}
            />
          </div>
          <div className="sf-field">
            <label>Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about this task…"
              rows={2}
              disabled={saving}
              style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', resize: 'vertical' }}
            />
          </div>
          <div className="tf-row">
            <div className="sf-field">
              <label>Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={saving} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', background: 'var(--surface)' }}>
                <option value="">Choose…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sf-field">
              <label>Due date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} disabled={saving} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none' }} />
            </div>
            <div className="sf-field">
              <label>Priority</label>
              <div className="priority-pick">
                {Object.entries(PRIORITY).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    className={`pp-btn ${priority === key ? 'selected' : ''}`}
                    style={priority === key ? { background: p.bg, color: p.color, borderColor: p.color } : {}}
                    onClick={() => setPriority(key)}
                    disabled={saving}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="sf-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add task')}
            </button>
          </div>
        </form>
      )}

      {subjects.length > 0 && tasks.length > 0 && (
        <div className="task-filters">
          {['all', 'pending', 'completed'].map((f) => (
            <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span className="fc-count">
                {f === 'all' ? tasks.length : f === 'pending' ? tasks.filter((t) => !t.completed).length : tasks.filter((t) => t.completed).length}
              </span>
            </button>
          ))}
        </div>
      )}

      {subjects.length > 0 && tasks.length === 0 && !showForm && (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <h3>No tasks yet</h3>
          <p>Add your first task to start tracking deadlines.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add a task</button>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="task-full-list">
          {sorted.map((t) => {
            const p = PRIORITY[t.priority] || PRIORITY.medium
            const overdue = t.due_date && !t.completed && new Date(t.due_date) < new Date(new Date().setHours(0, 0, 0, 0))
            return (
              <div key={t.id} className={`task-full-row ${t.completed ? 'done' : ''}`}>
                <button className="task-check" onClick={() => toggleComplete(t)} aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}>
                  {t.completed && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                  )}
                </button>
                <div className="task-full-info">
                  <span className="task-full-title">{t.title}</span>
                  {t.description && <span className="task-full-desc">{t.description}</span>}
                  <div className="task-full-meta">
                    {t.subject && (
                      <span className="tfm-chip" style={{ background: `${t.subject.color}15`, color: t.subject.color }}>
                        <span className="tfm-dot" style={{ background: t.subject.color }} />
                        {t.subject.name}
                      </span>
                    )}
                    <span className="tfm-chip" style={{ background: p.bg, color: p.color }}>{p.label}</span>
                    {t.due_date && (
                      <span className="tfm-due" style={{ color: overdue ? 'var(--error)' : 'var(--text-3)' }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
                        {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="task-full-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)} aria-label="Edit task">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  </button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(t.id)} aria-label="Delete task">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
