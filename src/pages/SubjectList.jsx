import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, sessions, tasks, loading, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)

  const studyTime = (sid) => sessions.filter(s => s.subject_id === sid).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const taskProgress = (sid) => {
    const st = tasks.filter(t => t.subject_id === sid)
    if (st.length === 0) return { done: 0, total: 0, pct: 0 }
    const done = st.filter(t => t.completed).length
    return { done, total: st.length, pct: done / st.length }
  }

  const addSubject = async () => {
    if (!name.trim()) return
    setSaving(true)
    await supabase.from('subjects').insert({ name: name.trim(), color, target_grade: targetGrade.trim() || null })
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade('')
    setShowForm(false); setSaving(false); refresh()
  }

  const deleteSubject = async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="subject-list">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Subjects</h2>
          <p className="page-desc">Organize your courses with custom colors, icons, and target grades.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Subject'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Subject</h3></div>
          <div className="form-field">
            <label>Subject Name</label>
            <input type="text" placeholder="e.g. Mathematics" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {SUBJECT_ICONS.map(ic => (
                <button key={ic} className={`icon-pick ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <button key={c} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Target Grade (optional)</label>
            <input type="text" placeholder="e.g. A" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addSubject} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Create Subject'}</button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to start tracking your study progress.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {subjects.map(s => {
            const time = studyTime(s.id)
            const tp = taskProgress(s.id)
            return (
              <div key={s.id} className="card subject-card" onClick={() => onNavigate('subject-detail', s.id)}>
                <div className="subject-card-top" style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}08)` }}>
                  <span className="subject-card-icon" style={{ background: s.color }}>{s.icon || '📘'}</span>
                  <button className="subject-del-btn" onClick={(e) => { e.stopPropagation(); deleteSubject(s.id) }}>✕</button>
                </div>
                <h3 className="subject-card-name">{s.name}</h3>
                <div className="subject-card-meta">
                  {s.target_grade && <span className="subject-grade-badge" style={{ color: s.color, background: `${s.color}15` }}>Target: {s.target_grade}</span>}
                  <span className="subject-time-badge">⏱️ {Math.floor(time / 60)}h {time % 60}m</span>
                </div>
                <div className="subject-task-progress">
                  <div className="subject-task-bar">
                    <div className="subject-task-fill" style={{ width: `${tp.pct * 100}%`, background: s.color }} />
                  </div>
                  <span className="subject-task-count">{tp.done}/{tp.total} tasks</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
