import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, todayStr, PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS } from '../lib/helpers.js'
import './TasksPage.css'

export default function Tasks() {
  const { user, subjects, tasks, refresh, addXp } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filter, setFilter] = useState('pending')
  const [busy, setBusy] = useState(false)

  const empty = { title: '', description: '', subject_id: '', due_date: '', priority: 'medium', difficulty: 'medium' }
  const [form, setForm] = useState(empty)

  const filtered = useMemo(() => {
    return tasks.filter(t => {
      if (filter === 'all') return !t.archived
      if (filter === 'pending') return !t.archived && !t.completed
      if (filter === 'completed') return !t.archived && t.completed
      if (filter === 'archived') return t.archived
      return true
    })
  }, [tasks, filter])

  const counts = useMemo(() => ({
    all: tasks.filter(t => !t.archived).length,
    pending: tasks.filter(t => !t.archived && !t.completed).length,
    completed: tasks.filter(t => !t.archived && t.completed).length,
    archived: tasks.filter(t => t.archived).length,
  }), [tasks])

  const openAdd = () => { setEditing(null); setForm(empty); setShowForm(true) }
  const openEdit = (t) => {
    setEditing(t)
    setForm({
      title: t.title || '', description: t.description || '',
      subject_id: t.subject_id || '', due_date: t.due_date || '',
      priority: t.priority || 'medium', difficulty: t.difficulty || 'medium',
    })
    setShowForm(true)
  }

  const submit = async () => {
    if (!form.title.trim() || busy) return
    setBusy(true)
    const payload = {
      user_id: user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      subject_id: form.subject_id || null,
      due_date: form.due_date || null,
      priority: form.priority,
      difficulty: form.difficulty,
    }
    if (editing) {
      await supabase.from('tasks').update(payload).eq('id', editing.id)
    } else {
      payload.completed = false
      payload.archived = false
      await supabase.from('tasks').insert(payload)
    }
    setForm(empty); setEditing(null); setShowForm(false); setBusy(false); refresh()
  }

  const toggle = async (t) => {
    const completed = !t.completed
    await supabase.from('tasks').update({ completed }).eq('id', t.id)
    if (completed) {
      await addXp(XP_REWARDS.task_complete)
      if (t.difficulty === 'hard') await addXp(XP_REWARDS.task_hard)
    }
    refresh()
  }

  const archive = async (t) => { await supabase.from('tasks').update({ archived: !t.archived }).eq('id', t.id); refresh() }
  const remove = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div>
          <h2>Tasks</h2>
          <p className="page-desc">Manage assignments with priorities, difficulty, due dates, and subjects.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ New Task</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head">
            <h3>{editing ? 'Edit Task' : 'New Task'}</h3>
            <button className="close-btn" onClick={() => { setShowForm(false); setEditing(null) }}>×</button>
          </div>
          <div className="form-field">
            <label>Title</label>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="What do you need to do?" />
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea rows="2" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional details" />
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Subject</label>
              <select value={form.subject_id} onChange={(e) => setForm({ ...form, subject_id: e.target.value })}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Due date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label>Priority</label>
              <div className="seg-pick">
                {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
                  <button key={k} className={`seg-btn ${form.priority === k ? 'active' : ''}`}
                    style={form.priority === k ? { background: v.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, priority: k })}>{v.label}</button>
                ))}
              </div>
            </div>
            <div className="form-field">
              <label>Difficulty</label>
              <div className="seg-pick">
                {Object.entries(DIFFICULTY_CONFIG).map(([k, v]) => (
                  <button key={k} className={`seg-btn ${form.difficulty === k ? 'active' : ''}`}
                    style={form.difficulty === k ? { background: v.color, color: '#fff' } : {}} onClick={() => setForm({ ...form, difficulty: k })}>{v.label}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => { setShowForm(false); setEditing(null) }}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>{editing ? 'Save' : 'Create'} Task</button>
          </div>
        </div>
      )}

      <div className="filter-row">
        {[
          { key: 'pending', label: 'Pending' },
          { key: 'completed', label: 'Completed' },
          { key: 'all', label: 'All' },
          { key: 'archived', label: 'Archived' },
        ].map(f => (
          <button key={f.key} className={`filter-chip ${filter === f.key ? 'active' : ''}`} onClick={() => setFilter(f.key)}>
            {f.label} <span className="fc-count">{counts[f.key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: '#fef4e6', color: '#f59e0b' }}>📋</div>
          <h3>No tasks here</h3>
          <p>{filter === 'pending' ? 'You have no pending tasks. Great job!' : 'Create a task to get started.'}</p>
        </div>
      ) : (
        <ul className="task-list">
          {filtered.map(t => {
            const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
            const dc = DIFFICULTY_CONFIG[t.difficulty] || DIFFICULTY_CONFIG.medium
            const overdue = t.due_date && !t.completed && t.due_date < todayStr()
            return (
              <li key={t.id} className={`task-item ${t.completed ? 'completed' : ''}`}>
                <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggle(t)}>
                  {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                </button>
                <div className="task-body">
                  <div className="task-title-row">
                    <span className="task-title">{t.title}</span>
                    {t.subject && <span className="task-subject" style={{ background: t.subject.color + '22', color: t.subject.color }}>{t.subject.icon} {t.subject.name}</span>}
                  </div>
                  {t.description && <p className="task-desc">{t.description}</p>}
                  <div className="task-meta">
                    <span className="meta-chip" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    <span className="meta-chip" style={{ background: dc.bg, color: dc.color }}>{dc.label}</span>
                    {t.due_date && <span className={`meta-chip ${overdue ? 'overdue' : ''}`}>📅 {formatDate(t.due_date)}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="task-action-btn" title="Edit" onClick={() => openEdit(t)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></svg>
                  </button>
                  <button className="task-action-btn" title={t.archived ? 'Unarchive' : 'Archive'} onClick={() => archive(t)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4" /></svg>
                  </button>
                  <button className="task-action-btn danger" title="Delete" onClick={() => remove(t.id)}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
