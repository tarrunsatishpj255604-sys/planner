import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { PRIORITY_CONFIG, formatDate } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { subjects, tasks, addXp, unlockAchievement, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [filter, setFilter] = useState('all')

  const resetForm = () => { setTitle(''); setDesc(''); setSubjectId(''); setDueDate(''); setPriority('medium'); setEditing(null); setShowForm(false) }

  const saveTask = async () => {
    if (!title.trim()) return
    const payload = { title: title.trim(), description: desc.trim() || null, subject_id: subjectId || null, due_date: dueDate || null, priority }
    if (editing) { await supabase.from('tasks').update(payload).eq('id', editing.id) }
    else { await supabase.from('tasks').insert({ ...payload, completed: false }).select().single() }
    resetForm(); refresh()
  }

  const toggleTask = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    if (!task.completed) { addXp(20); unlockAchievement('first_task') }
    refresh()
  }

  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const startEdit = (task) => {
    setEditing(task); setTitle(task.title); setDesc(task.description || ''); setSubjectId(task.subject_id || ''); setDueDate(task.due_date || ''); setPriority(task.priority || 'medium'); setShowForm(true)
  }

  const filtered = tasks.filter(t => {
    if (filter === 'pending') return !t.completed
    if (filter === 'completed') return t.completed
    return true
  })

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div><h2>Tasks</h2><p className="page-desc">Manage your assignments and to-dos</p></div>
        <button className="btn btn-primary" onClick={() => { if (editing) resetForm(); setShowForm(!showForm) }}>{showForm ? 'Cancel' : '+ Add Task'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>{editing ? 'Edit Task' : 'New Task'}</h3>
          <div className="form-field"><label>Title</label><input value={title} onChange={e => setTitle(e.target.value)} placeholder="What do you need to do?" /></div>
          <div className="form-field"><label>Description (optional)</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Add details..." rows={2} /></div>
          <div className="form-row">
            <div className="form-field"><label>Subject</label><select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
            <div className="form-field"><label>Due Date</label><input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></div>
          </div>
          <div className="form-field"><label>Priority</label><div className="seg-pick">{Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => <button key={key} className={`seg-btn ${priority === key ? 'active' : ''}`} style={priority === key ? { background: cfg.color, color: '#fff' } : {}} onClick={() => setPriority(key)}>{cfg.label}</button>)}</div></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={saveTask}>{editing ? 'Update' : 'Create'} Task</button></div>
        </div>
      )}

      <div className="filter-row">{['all', 'pending', 'completed'].map(f => <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}<span className="fc-count">{f === 'all' ? tasks.length : f === 'pending' ? tasks.filter(t => !t.completed).length : tasks.filter(t => t.completed).length}</span></button>)}</div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📋</div><h3>No tasks yet</h3><p>Create a task to get started.</p></div>
      ) : (
        <div className="task-list">
          {filtered.map(task => {
            const cfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
            return (
              <div key={task.id} className={`task-item ${task.completed ? 'done' : ''}`}>
                <span className="task-check" style={task.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}} onClick={() => toggleTask(task)} />
                <div className="task-info">
                  <span className="task-title">{task.title}</span>
                  {task.description && <span className="task-desc">{task.description}</span>}
                  <div className="task-meta">
                    <span className="meta-chip" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                    {task.subject && <span className="meta-chip" style={{ background: (task.subject.color || '#4f7cff') + '20', color: task.subject.color }}>{task.subject.name}</span>}
                    {task.due_date && <span className="meta-chip due">{formatDate(task.due_date)}</span>}
                  </div>
                </div>
                <div className="task-actions"><button className="btn btn-ghost btn-sm" onClick={() => startEdit(task)}>Edit</button><button className="btn btn-ghost btn-sm" onClick={() => deleteTask(task.id)}>Delete</button></div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
