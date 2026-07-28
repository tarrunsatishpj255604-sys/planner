import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, sessions, tasks, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setName(''); setColor(SUBJECT_COLORS[0]); setIcon(SUBJECT_ICONS[0])
    setTargetGrade(''); setError(''); setShowForm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setError('Subject name is required.'); return }
    setSaving(true)
    const { error } = await supabase.from('subjects').insert({
      name: name.trim(), color, icon, target_grade: targetGrade.trim() || null,
    })
    if (error) { setError(error.message); setSaving(false); return }
    reset(); refresh()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject? All tasks and sessions linked to it will be affected.')) return
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  const getSubjectStats = (id) => {
    const subSessions = sessions.filter(s => s.subject_id === id)
    const totalMin = subSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
    const subTasks = tasks.filter(t => t.subject_id === id)
    const completed = subTasks.filter(t => t.completed).length
    const pct = subTasks.length > 0 ? Math.round((completed / subTasks.length) * 100) : 0
    return { totalMin, taskCount: subTasks.length, completed, pct }
  }

  return (
    <div className="subjects-page">
      <div className="page-toolbar">
        <p className="page-desc">Create your own subjects and customize them. Click any subject to see notes, flashcards, assignments, and more.</p>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add subject
          </button>
        )}
      </div>

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-head">
            <h3>New Subject</h3>
            <button type="button" className="close-btn" onClick={reset}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <div className="form-error">{error}</div>}
          <div className="form-row">
            <div className="form-field" style={{ flex: 2 }}>
              <label>Subject name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Physics" autoFocus disabled={saving} />
            </div>
            <div className="form-field" style={{ flex: 1 }}>
              <label>Target grade</label>
              <input type="text" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} placeholder="e.g. A" disabled={saving} />
            </div>
          </div>
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {SUBJECT_ICONS.map(ic => (
                <button key={ic} type="button" className={`icon-swatch ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <button key={c} type="button" className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={reset}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving && <span className="spinner" />}{saving ? 'Saving…' : 'Add subject'}
            </button>
          </div>
        </form>
      )}

      {subjects.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to get started. You can fully customize the name, icon, and color.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add your first subject</button>
        </div>
      ) : (
        <div className="subject-grid">
          {subjects.map(s => {
            const stats = getSubjectStats(s.id)
            return (
              <div key={s.id} className="subject-card" style={{ borderTopColor: s.color }} onClick={() => onNavigate('subject-detail', s.id)}>
                <div className="sc-head">
                  <span className="sc-icon">{s.icon}</span>
                  <div>
                    <h3>{s.name}</h3>
                    {s.target_grade && <span className="sc-grade">Target: {s.target_grade}</span>}
                  </div>
                </div>
                <div className="sc-stats">
                  <div className="sc-stat">
                    <span className="sc-stat-val">{Math.floor(stats.totalMin / 60)}h {stats.totalMin % 60}m</span>
                    <span className="sc-stat-label">Studied</span>
                  </div>
                  <div className="sc-stat">
                    <span className="sc-stat-val">{stats.completed}/{stats.taskCount}</span>
                    <span className="sc-stat-label">Tasks</span>
                  </div>
                </div>
                <div className="sc-progress">
                  <div className="sc-progress-bar" style={{ width: `${stats.pct}%`, background: s.color }} />
                </div>
                <div className="sc-foot">
                  <span className="sc-pct">{stats.pct}% complete</span>
                  <button className="btn btn-ghost btn-sm sc-del" onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }} style={{ color: 'var(--error)' }}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
