import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, todayStr } from '../lib/helpers.js'
import './TasksPage.css'

const emptyForm = { title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }

export default function Tasks() {
  const { tasks, subjects, refresh, addXp, unlockAchievement, loading } = useApp()
  const [filter, setFilter] = useState('pending')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter(t => {
      if (filter === 'pending') return !t.completed && !t.archived
      if (filter === 'completed') return t.completed && !t.archived
      if (filter === 'archived') return t.archived
      return !t.archived
    })
  }, [tasks, filter])

  const counts = useMemo(() => ({
    all: (tasks || []).filter(t => !t.archived).length,
    pending: (tasks || []).filter(t => !t.completed && !t.archived).length,
    completed: (tasks || []).filter(t => t.completed && !t.archived).length,
    archived: (tasks || []).filter(t => t.archived).length,
  }), [tasks])

  const openForm = (task = null) => {
    if (task) { setForm({ title: task.title, description: task.description || '', subject_id: task.subject_id || '', due_date: task.due_date || '', priority: task.priority || 'medium', difficulty: task.difficulty || 'medium' }); setEditingId(task.id) }
    else { setForm(emptyForm); setEditingId(null) }
    setShowForm(true)
  }

  const saveTask = async () => {
    if (!form.title.trim()) return
    const payload = { title: form.title.trim(), description: form.description, subject_id: form.subject_id || null, due_date: form.due_date || null, priority: form.priority, difficulty: form.difficulty }
    if (editingId) {
      await supabase.from('tasks').update(payload).eq('id', editingId)
    } else {
      const { data } = await supabase.from('tasks').insert(payload).select().single()
      if (data) unlockAchievement('first_task')
    }
    setForm(emptyForm); setEditingId(null); setShowForm(false); refresh()
  }

  const toggleTask = useCallback(async (task) => {
    const newCompleted = !task.completed
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id)
    if (newCompleted) {
      const xp = XP_REWARDS.task_complete + (task.difficulty === 'hard' ? XP_REWARDS.task_hard : 0)
      await addXp(xp)
      const doneCount = (tasks || []).filter(t => t.completed).length + 1
      if (doneCount >= 10) unlockAchievement('tasks_10')
      if (doneCount >= 50) unlockAchievement('tasks_50')
    }
    refresh()
  }, [tasks, addXp, unlockAchievement, refresh])

  const archiveTask = async (task) => { await supabase.from('tasks').update({ archived: !task.archived }).eq('id', task.id); refresh() }
  const deleteTask = async (task) => { await supabase.from('tasks').delete().eq('id', task.id); refresh() }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div><h2>Tasks</h2><p className="page-desc">Manage your assignments and to-dos.</p></div>
        <button className="btn btn-primary" onClick={() => openForm()}>+ New Task</button>
      </div>

      <div className="task-filters">
        {['all', 'pending', 'completed', 'archived'].map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
            <span className="filter-chip-label">{f.charAt(0).toUpperCase() + f.slice(1)}</span>
            <span className="fc-count">{counts[f]}</span>
          </button>
        ))}
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>{editingId ? 'Edit Task' : 'New Task'}</h3><button className="close-btn" onClick={() => setShowForm(false)}>✕</button></div>
          <div className="form-field"><label>Title</label><input type="text" placeholder="What needs to be done?" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
          <div className="form-field"><label>Description</label><textarea placeholder="Add details..." rows="2" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label><select value={form.subject_id} onChange={e => setForm({ ...form, subject_id: e.target.value })}><option value="">None</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
            <div className="form-field"><label>Due Date</label><input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
          </div>
          <div className="form-field"><label>Priority</label><div className="seg-pick">{Object.entries(PRIORITY_CONFIG).map(([k, v]) => <button key={k} className={`seg-btn ${form.priority === k ? 'active' : ''}`} style={form.priority === k ? { background: v.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, priority: k })}>{v.label}</button>)}</div></div>
          <div className="form-field"><label>Difficulty</label><div className="seg-pick">{Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => <button key={k} className={`seg-btn ${form.difficulty === k ? 'active' : ''}`} style={form.difficulty === k ? { background: v.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, difficulty: k })}>{v.label} (+{v.xp}xp)</button>)}</div></div>
          <div className="form-actions"><button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button><button className="btn btn-primary" onClick={saveTask} disabled={!form.title.trim()}>{editingId ? 'Update' : 'Add Task'}</button></div>
        </div>
      )}

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)' }}>✅</div><h3>No tasks here</h3><p>{filter === 'pending' ? 'All caught up! Create a new task to get started.' : `No ${filter} tasks.`}</p></div>
        ) : filteredTasks.map(t => (
          <div key={t.id} className={`card task-item ${t.completed ? 'completed' : ''}`}>
            <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
              {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
            <div className="task-item-body">
              <div className="task-item-title">{t.title}</div>
              {t.description && <div className="task-item-desc">{t.description}</div>}
              <div className="task-item-meta">
                {t.subject && <span className="meta-chip" style={{ color: t.subject.color, background: `${t.subject.color}18` }}>{t.subject.icon} {t.subject.name}</span>}
                {t.due_date && <span className="meta-chip" style={{ color: 'var(--text-2)' }}>📅 {formatDate(t.due_date)}</span>}
                <span className="meta-chip" style={{ color: PRIORITY_CONFIG[t.priority]?.color, background: PRIORITY_CONFIG[t.priority]?.bg }}>{PRIORITY_CONFIG[t.priority]?.label}</span>
                <span className="meta-chip" style={{ color: DIFFICULTY_CONFIG[t.difficulty]?.color, background: DIFFICULTY_CONFIG[t.difficulty]?.bg }}>{DIFFICULTY_CONFIG[t.difficulty]?.label}</span>
              </div>
            </div>
            <div className="task-item-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => openForm(t)} title="Edit">✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => archiveTask(t)} title={t.archived ? 'Unarchive' : 'Archive'}>📦</button>
              <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(t)} title="Delete">🗑️</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
