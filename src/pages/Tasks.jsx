import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { subjects, tasks, loading, refresh, addXp, unlockAchievement } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [filter, setFilter] = useState('all')
  const [form, setForm] = useState({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' })

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  const resetForm = () => { setForm({ title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }); setShowForm(false); setEditingId(null) }

  const saveTask = async () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), description: form.description.trim() || null, subject_id: form.subject_id || null, due_date: form.due_date || null, priority: form.priority, difficulty: form.difficulty }
    if (editingId) {
      await supabase.from('tasks').update(payload).eq('id', editingId)
    } else {
      await supabase.from('tasks').insert(payload)
    }
    resetForm(); refresh()
  }

  const editTask = (t) => {
    setForm({ title: t.title, description: t.description || '', subject_id: t.subject_id || '', due_date: t.due_date || '', priority: t.priority || 'medium', difficulty: t.difficulty || 'medium' })
    setEditingId(t.id); setShowForm(true)
  }

  const toggleTask = async (t) => {
    if (t.completed) {
      await supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', t.id)
    } else {
      await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', t.id)
      let xp = XP_REWARDS.task_complete
      if (t.difficulty === 'hard') xp += XP_REWARDS.task_hard - XP_REWARDS.task_complete
      await addXp(xp)
      await unlockAchievement('first_task')
    }
    refresh()
  }

  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const filtered = tasks.filter(t => filter === 'all' ? true : filter === 'pending' ? !t.completed : t.completed)
  const counts = { all: tasks.length, pending: tasks.filter(t => !t.completed).length, completed: tasks.filter(t => t.completed).length }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Tasks</h2>
          <p className="page-desc">Manage your assignments with priority, difficulty, and due dates.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(!showForm) }}>{showForm ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>{editingId ? 'Edit Task' : 'New Task'}</h3></div>
          <div className="form-field">
            <label>Title</label>
            <input type="text" placeholder="Task title" value={form.title} onChange={e => set('title', e.target.value)} autoFocus />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea placeholder="Optional description" value={form.description} onChange={e => set('description', e.target.value)} rows="2" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Subject</label>
              <select value={form.subject_id} onChange={e => set('subject_id', e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due Date</label>
              <input type="date" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Priority</label>
              <div className="seg-pick">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <button key={k} className={`seg-btn ${form.priority === k ? 'active' : ''}`} style={form.priority === k ? { background: v.color, color: '#fff' } : {}} onClick={() => set('priority', k)}>{v.label}</button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <div className="seg-pick">
                {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                  <button key={k} className={`seg-btn ${form.difficulty === k ? 'active' : ''}`} style={form.difficulty === k ? { background: v.color, color: '#fff' } : {}} onClick={() => set('difficulty', k)}>{v.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={resetForm}>Cancel</button>
            <button className="btn btn-primary" onClick={saveTask} disabled={!form.title.trim()}>{editingId ? 'Update' : 'Add'} Task</button>
          </div>
        </div>
      )}

      <div className="task-filters">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All <span className="fc-count">{counts.all}</span></button>
        <button className={`filter-chip ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>Pending <span className="fc-count">{counts.pending}</span></button>
        <button className={`filter-chip ${filter === 'completed' ? 'active' : ''}`} onClick={() => setFilter('completed')}>Completed <span className="fc-count">{counts.completed}</span></button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📋</div>
          <h3>No tasks here</h3>
          <p>{filter === 'completed' ? 'No completed tasks yet.' : 'Add a task to get started.'}</p>
        </div>
      ) : (
        <div className="task-list">
          {filtered.map(t => {
            const p = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
            const d = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG.medium
            return (
              <div key={t.id} className={`card task-row ${t.completed ? 'done' : ''}`}>
                <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                <div className="task-row-info">
                  <span className={t.completed ? 'task-row-title done' : 'task-row-title'}>{t.title}</span>
                  {t.description && <span className="task-row-desc">{t.description}</span>}
                  <div className="task-row-tags">
                    {t.subject && <span className="task-tag" style={{ color: t.subject.color, background: `${t.subject.color}15` }}>{t.subject.name}</span>}
                    <span className="task-tag" style={{ color: p.color, background: p.bg }}>{p.label}</span>
                    <span className="task-tag" style={{ color: d.color, background: d.bg }}>{d.label}</span>
                    {t.due_date && <span className="task-tag due">{formatDate(t.due_date)}</span>}
                  </div>
                </div>
                <div className="task-row-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => editTask(t)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(t.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
