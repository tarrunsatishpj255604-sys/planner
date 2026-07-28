import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { subjects, tasks, refresh, addXp } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' })

  const setField = (k, v) => setForm({ ...form, [k]: v })

  const submit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const { data: u } = await supabase.auth.getUser()
    if (editing) {
      await supabase.from('tasks').update({ ...form }).eq('id', editing.id)
      setEditing(null)
    } else {
      await supabase.from('tasks').insert({ user_id: u.user.id, ...form })
    }
    setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' })
    setShowForm(false)
    refresh()
  }

  const startEdit = (t) => {
    setEditing(t)
    setForm({ title: t.title, description: t.description || '', subject_id: t.subject_id || '', due_date: t.due_date || '', priority: t.priority || 'medium', difficulty: t.difficulty || 'medium' })
    setShowForm(true)
  }

  const toggleTask = async (t) => {
    const completed = !t.completed
    await supabase.from('tasks').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', t.id)
    if (completed) {
      const diff = DIFFICULTY_CONFIG[t.difficulty]?.xp || XP_REWARDS.task_complete
      await addXp(diff + XP_REWARDS.task_complete)
    }
    refresh()
  }

  const archiveTask = async (t) => {
    await supabase.from('tasks').update({ archived: !t.archived }).eq('id', t.id)
    refresh()
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id)
    refresh()
  }

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'all') return !t.archived
      if (filter === 'pending') return !t.completed && !t.archived
      if (filter === 'completed') return t.completed && !t.archived
      if (filter === 'archived') return t.archived
      return true
    })
  }, [tasks, filter])

  const counts = useMemo(() => ({
    all: tasks.filter(t => !t.archived).length,
    pending: tasks.filter(t => !t.completed && !t.archived).length,
    completed: tasks.filter(t => t.completed && !t.archived).length,
    archived: tasks.filter(t => t.archived).length,
  }), [tasks])

  const getSubject = (id) => subjects.find(s => s.id === id)

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div>
          <h2>Tasks</h2>
          <p className="page-desc">Manage your assignments and to-dos across all subjects.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }); setShowForm(!showForm) }}>
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={submit}>
          <div className="form-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setField('title', e.target.value)} placeholder="Task title" autoFocus />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setField('description', e.target.value)} placeholder="Optional description" rows={2} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Subject</label>
              <select value={form.subject_id} onChange={(e) => setField('subject_id', e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setField('due_date', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Priority</label>
              <div className="seg-pick">
                {Object.entries(PRIORITY_CONFIG).map(([k, cfg]) => (
                  <button key={k} type="button" className={`seg-btn ${form.priority === k ? 'active' : ''}`}
                    style={form.priority === k ? { background: cfg.color, borderColor: cfg.color } : {}} onClick={() => setField('priority', k)}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <div className="seg-pick">
                {Object.entries(DIFFICULTY_CONFIG).map(([k, cfg]) => (
                  <button key={k} type="button" className={`seg-btn ${form.difficulty === k ? 'active' : ''}`}
                    style={form.difficulty === k ? { background: cfg.color, borderColor: cfg.color } : {}} onClick={() => setField('difficulty', k)}>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button type="submit" className="btn btn-primary">{editing ? 'Save' : 'Add Task'}</button>
          </div>
        </form>
      )}

      <div className="filter-chips">
        {['all', 'pending', 'completed', 'archived'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)} <span className="fc-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📝</div>
          <h3>No tasks here</h3>
          <p>Add a task or change your filter.</p>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(t => {
            const sub = getSubject(t.subject_id)
            const pc = PRIORITY_CONFIG[t.priority]
            const dc = DIFFICULTY_CONFIG[t.difficulty]
            return (
              <div key={t.id} className={`task-row ${t.completed ? 'done' : ''}`}>
                <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)}>{t.completed && '✓'}</button>
                <div className="task-main">
                  <div className="task-title">{t.title}</div>
                  {t.description && <div className="task-desc">{t.description}</div>}
                  <div className="task-meta">
                    {sub && <span className="task-chip" style={{ background: sub.color + '18', color: sub.color }}>{sub.icon} {sub.name}</span>}
                    {t.due_date && <span className="task-chip">📅 {formatDate(t.due_date)}</span>}
                    {pc && <span className="task-chip" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>}
                    {dc && <span className="task-chip" style={{ background: dc.bg, color: dc.color }}>{dc.label}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(t)}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => archiveTask(t)}>📦</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(t.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
