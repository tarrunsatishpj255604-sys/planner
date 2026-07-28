import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { user, tasks, subjects, addXp, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' })

  const resetForm = () => { setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }); setEditing(null); setShowForm(false) }

  const startEdit = (t) => {
    setEditing(t.id)
    setForm({ title: t.title, description: t.description || '', subject_id: t.subject_id || '', due_date: t.due_date || '', priority: t.priority || 'medium', difficulty: t.difficulty || 'medium' })
    setShowForm(true)
  }

  const submitTask = async () => {
    if (!form.title.trim()) return
    const payload = { user_id: user.id, title: form.title.trim(), description: form.description.trim() || null, subject_id: form.subject_id || null, due_date: form.due_date || null, priority: form.priority, difficulty: form.difficulty }
    if (editing) {
      await supabase.from('tasks').update(payload).eq('id', editing)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    resetForm(); refresh()
  }

  const toggleTask = async (task) => {
    const newCompleted = !task.completed
    const updates = { completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    if (newCompleted) { const diff = DIFFICULTY_CONFIG[task.difficulty]?.xp || XP_REWARDS.task_complete; await addXp(diff) }
    refresh()
  }

  const archiveTask = async (task) => {
    await supabase.from('tasks').update({ archived: !task.archived }).eq('id', task.id)
    refresh()
  }

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    refresh()
  }

  const filtered = tasks.filter(t => {
    if (filter === 'all') return !t.archived
    if (filter === 'pending') return !t.completed && !t.archived
    if (filter === 'completed') return t.completed && !t.archived
    if (filter === 'archived') return t.archived
    return true
  })

  const counts = { all: tasks.filter(t => !t.archived).length, pending: tasks.filter(t => !t.completed && !t.archived).length, completed: tasks.filter(t => t.completed && !t.archived).length, archived: tasks.filter(t => t.archived).length }

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div>
          <h2>Tasks</h2>
          <p className="page-desc">Manage your assignments with priorities, difficulty levels, and due dates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { if (editing) resetForm(); setShowForm(!showForm) }}>
          {showForm ? 'Cancel' : '+ Add Task'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>{editing ? 'Edit Task' : 'New Task'}</h3></div>
          <div className="form-field">
            <label>Title</label>
            <input type="text" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea rows={2} placeholder="Optional details..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Subject</label>
              <select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="form-field">
            <label>Priority</label>
            <div className="seg-pick">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button key={key} className={`seg-btn ${form.priority === key ? 'active' : ''}`} style={form.priority === key ? { background: cfg.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, priority: key })}>{cfg.label}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Difficulty</label>
            <div className="seg-pick">
              {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                <button key={key} className={`seg-btn ${form.difficulty === key ? 'active' : ''}`} style={form.difficulty === key ? { background: cfg.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, difficulty: key })}>
                  {cfg.label} <span className="seg-xp">+{cfg.xp}xp</span>
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            <button className="btn btn-primary" onClick={submitTask}>{editing ? 'Save' : 'Create Task'}</button>
          </div>
        </div>
      )}

      <div className="task-filters">
        {[['all', 'All'], ['pending', 'Pending'], ['completed', 'Completed'], ['archived', 'Archived']].map(([key, label]) => (
          <button key={key} className={`filter-chip ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>
            {label}<span className="fc-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📋</div>
          <h3>No tasks here</h3>
          <p>{filter === 'pending' ? 'All caught up! Add a new task to get started.' : 'No tasks in this filter.'}</p>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(t => {
            const pCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
            const dCfg = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG.medium
            return (
              <div key={t.id} className={`task-row ${t.completed ? 'completed' : ''}`}>
                <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                  {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </button>
                <div className="task-row-info">
                  <span className="task-row-title">{t.title}</span>
                  {t.description && <span className="task-row-desc">{t.description}</span>}
                  <div className="task-row-meta">
                    {t.subject && <span className="task-chip" style={{ background: t.subject.color + '20', color: t.subject.color }}>{t.subject.icon} {t.subject.name}</span>}
                    {t.due_date && <span className="task-chip" style={{ background: 'var(--surface-2)', color: 'var(--text-2)' }}>📅 {formatDate(t.due_date)}</span>}
                    <span className="task-chip" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                    <span className="task-chip" style={{ background: dCfg.bg, color: dCfg.color }}>{dCfg.label}</span>
                  </div>
                </div>
                <div className="task-row-actions">
                  <button className="btn btn-sm btn-ghost" onClick={() => startEdit(t)}>✏️</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => archiveTask(t)}>{t.archived ? '♻️' : '📦'}</button>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteTask(t.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
