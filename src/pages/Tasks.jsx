import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, formatDate, todayStr } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { tasks, subjects, loading, refresh, addXp, unlockAchievement } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' })

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const resetForm = () => { setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }); setEditingId(null); setShowForm(false) }

  const submit = async () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), description: form.description.trim() || null, subject_id: form.subject_id || null, due_date: form.due_date || null, priority: form.priority, difficulty: form.difficulty }
    if (editingId) {
      await supabase.from('tasks').update(payload).eq('id', editingId)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    resetForm(); refresh()
  }

  const edit = (t) => {
    setEditingId(t.id); setShowForm(true)
    setForm({ title: t.title || '', description: t.description || '', subject_id: t.subject_id || '', due_date: t.due_date || '', priority: t.priority || 'medium', difficulty: t.difficulty || 'medium' })
  }

  const toggle = async (t) => {
    if (t.completed) {
      await supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', t.id)
    } else {
      const diff = t.difficulty || 'medium'
      const xp = XP_REWARDS.task_complete + (diff === 'hard' ? XP_REWARDS.task_hard : diff === 'medium' ? 10 : 0)
      await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', t.id)
      await addXp(xp); await unlockAchievement('first_task')
    }
    refresh()
  }

  const del = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const filtered = tasks.filter(t => filter === 'all' ? true : filter === 'pending' ? !t.completed : t.completed)
  const counts = { all: tasks.length, pending: tasks.filter(t => !t.completed).length, completed: tasks.filter(t => t.completed).length }

  if (loading) return <div className="tasks-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Tasks</h2><p className="page-desc">Track assignments and to-dos.</p></div>
        <button className="btn btn-primary" onClick={() => { if (showForm) resetForm(); else setShowForm(true) }}>{showForm ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>{editingId ? 'Edit Task' : 'New Task'}</h3></div>
          <div className="form-field"><label>Title</label><input value={form.title} onChange={e => setF('title', e.target.value)} placeholder="Task title" /></div>
          <div className="form-field"><label>Description</label><textarea value={form.description} onChange={e => setF('description', e.target.value)} rows={2} placeholder="Optional details" /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label>
              <select value={form.subject_id} onChange={e => setF('subject_id', e.target.value)}>
                <option value="">None</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-field"><label>Due date</label><input type="date" value={form.due_date} onChange={e => setF('due_date', e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Priority</label>
            <div className="seg-pick">
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                <button key={k} className={`seg-btn ${form.priority === k ? 'active' : ''}`} style={form.priority === k ? { background: v.color, color: '#fff', borderColor: v.color } : {}} onClick={() => setF('priority', k)}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="form-field"><label>Difficulty</label>
            <div className="seg-pick">
              {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                <button key={k} className={`seg-btn ${form.difficulty === k ? 'active' : ''}`} style={form.difficulty === k ? { background: v.color, color: '#fff', borderColor: v.color } : {}} onClick={() => setF('difficulty', k)}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={!form.title.trim()}>{editingId ? 'Update' : 'Create'}</button>
          </div>
        </div>
      )}

      <div className="filter-row">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All <span className="fc-count">{counts.all}</span></button>
        <button className={`filter-chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending <span className="fc-count">{counts.pending}</span></button>
        <button className={`filter-chip ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed <span className="fc-count">{counts.completed}</span></button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📋</div><h3>No tasks here</h3><p>Add a task to get started.</p></div>
      ) : (
        <div className="task-list-full">
          {filtered.map(t => {
            const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
            return (
              <div key={t.id} className={`task-row ${t.completed ? 'done' : ''}`}>
                <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggle(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : { borderColor: p.color }} />
                <div className="task-row-main">
                  <div className="task-row-top">
                    <strong>{t.title}</strong>
                    {t.subject && <span className="task-subj-chip" style={{ background: t.subject.color + '22', color: t.subject.color }}>{t.subject.name}</span>}
                  </div>
                  {t.description && <p className="task-desc">{t.description}</p>}
                  <div className="task-meta">
                    {t.due_date && <span className="task-due">📅 {formatDate(t.due_date)}</span>}
                    <span className="task-pri" style={{ color: p.color }}>● {p.label}</span>
                    {t.difficulty && <span className="task-diff">⚡ {t.difficulty}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => edit(t)}>Edit</button>
                  <button className="btn btn-ghost btn-sm task-del-btn" onClick={() => del(t.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
