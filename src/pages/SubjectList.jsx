import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { user, subjects, tasks, sessions, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('A')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    await supabase.from('subjects').insert({
      user_id: user.id,
      name: name.trim(),
      icon,
      color,
      target_grade: targetGrade,
    })
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade('A')
    setBusy(false); setShowForm(false); refresh()
  }

  const remove = async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  const subjectStats = (s) => {
    const subjTasks = tasks.filter(t => t.subject_id === s.id && !t.archived)
    const done = subjTasks.filter(t => t.completed).length
    const total = subjTasks.length
    const mins = sessions.filter(se => se.subject_id === s.id).reduce((sum, se) => sum + (se.duration || 0), 0)
    return { done, total, mins }
  }

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div>
          <h2>Subjects</h2>
          <p className="page-desc">Create subjects to organize notes, flashcards, tasks, and study time.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(v => !v)}>
          {showForm ? 'Cancel' : '+ Add Subject'}
        </button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Subject</h3></div>
          <div className="form-field">
            <label>Subject name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" />
          </div>
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {SUBJECT_ICONS.map(ic => (
                <button key={ic} className={`icon-swatch ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <button key={c} className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c, color: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Target grade</label>
            <input value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} placeholder="A" />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submit} disabled={busy}>Create Subject</button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: '#e8efff', color: '#4f7cff' }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to start organizing your study materials.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {subjects.map(s => {
            const stats = subjectStats(s)
            const pct = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
            return (
              <div key={s.id} className="subject-card" onClick={() => onNavigate('subject-detail', s.id)}>
                <div className="subject-card-top" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}>
                  <span className="subject-card-icon">{s.icon}</span>
                  <button className="subject-delete" onClick={(e) => { e.stopPropagation(); remove(s.id) }}>×</button>
                </div>
                <div className="subject-card-body">
                  <h3>{s.name}</h3>
                  <div className="subject-meta">
                    <span className="subject-grade">Target: {s.target_grade || '—'}</span>
                    <span className="subject-time">⏱️ {Math.floor(stats.mins / 60)}h {stats.mins % 60}m</span>
                  </div>
                  <div className="subject-progress">
                    <div className="subject-progress-bar" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <span className="subject-progress-label">{stats.done}/{stats.total} tasks done</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
