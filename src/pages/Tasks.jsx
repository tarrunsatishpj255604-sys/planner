import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, XP_REWARDS, formatDate, todayStr } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { tasks, subjects, loading, refresh, addXp, unlockAchievement } = useApp()
  const [filter, setFilter] = useState('all')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium' })
  const [showForm, setShowForm] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  const submit = async () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), description: form.description.trim() || null, subject_id: form.subject_id || null, due_date: form.due_date || null, priority: form.priority, completed: false }
    if (editing) {
      await supabase.from('tasks').update(payload).eq('id', editing)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium' })
    setEditing(null); setShowForm(false); refresh()
  }

  const toggle = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    if (!task.completed) { await addXp(XP_REWARDS.task_complete); await unlockAchievement('first_task') }
    refresh()
  }

  const del = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const startEdit = (task) => {
    setEditing(task.id)
    setForm({ title: task.title, description: task.description || '', subject_id: task.subject_id || '', due_date: task.due_date || '', priority: task.priority || 'medium' })
    setShowForm(true)
  }

  const cancel = () => { setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium' }); setEditing(null); setShowForm(false) }

  const counts = { all: tasks.length, pending: tasks.filter(t => !t.completed).length, completed: tasks.filter(t => t.completed).length }

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div><h2>Tasks</h2><p className="page-desc">Manage your assignments and to-dos with priorities, due dates, and subject tags.</p></div>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium' }); setShowForm(s => !s) }}>{showForm ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>{editing ? 'Edit Task' : 'New Task'}</h3></div>
          <div className="form-field"><label>Title</label><input type="text" placeholder="What needs to be done?" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
          <div className="form-field"><label>Description</label><textarea rows="2" placeholder="Optional details..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label>
              <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
          </div>
          <div className="form-field"><label>Priority</label>
            <div className="seg-pick">
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <button key={key} className={`seg-btn ${form.priority === key ? 'active' : ''}`} style={form.priority === key ? { background: cfg.color, color: '#fff', borderColor: cfg.color } : {}} onClick={() => setForm(f => ({ ...f, priority: key }))}>
                  <span className="seg-dot" style={{ background: cfg.color }} />{cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={cancel}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={!form.title.trim()}>{editing ? 'Update' : 'Add'} Task</button>
          </div>
        </div>
      )}

      <div className="filter-row">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All <span className="fc-count">{counts.all}</span></button>
        <button className={`filter-chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending <span className="fc-count">{counts.pending}</span></button>
        <button className={`filter-chip ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed <span className="fc-count">{counts.completed}</span></button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)', fontSize: 28 }}>📋</div>
          <h3>{filter === 'completed' ? 'No completed tasks yet' : filter === 'pending' ? 'No pending tasks' : 'No tasks yet'}</h3>
          <p>{filter === 'all' ? 'Create your first task to get started.' : ''}</p>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(task => {
            const pCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            const subj = subjects.find(s => s.id === task.subject_id)
            const overdue = task.due_date && !task.completed && new Date(task.due_date) < new Date(todayStr())
            return (
              <div key={task.id} className={`task-row ${task.completed ? 'completed' : ''}`}>
                <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => toggle(task)} style={task.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                  {task.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </button>
                <div className="task-main">
                  <div className="task-title-row">
                    <span className="task-title">{task.title}</span>
                    <span className="task-priority-tag" style={{ background: pCfg.bg, color: pCfg.color }}>{pCfg.label}</span>
                  </div>
                  {task.description && <p className="task-desc">{task.description}</p>}
                  <div className="task-meta">
                    {subj && <span className="task-subject-tag" style={{ background: subj.color + '22', color: subj.color }}>{subj.icon} {subj.name}</span>}
                    {task.due_date && <span className={`task-due ${overdue ? 'overdue' : ''}`}>{overdue ? '⚠ ' : '📅 '}{formatDate(task.due_date)}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => startEdit(task)}>✏️</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => del(task.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
