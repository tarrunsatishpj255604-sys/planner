import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, tasks, sessions, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('subjects').insert({
      user_id: u.user.id, name: name.trim(), icon, color, target_grade: targetGrade || null,
    })
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade(''); setShowForm(false)
    refresh()
  }

  const remove = async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  const getStudyTime = (sid) => sessions.filter(s => s.subject_id === sid).reduce((sum, s) => sum + (s.duration || 0), 0)
  const getTaskProgress = (sid) => {
    const subTasks = tasks.filter(t => t.subject_id === sid)
    if (subTasks.length === 0) return 0
    return Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100)
  }

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div>
          <h2>Subjects</h2>
          <p className="page-desc">Manage your subjects, track progress, and stay organized.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Subject'}
        </button>
      </div>

      {showForm && (
        <form className="form-card" onSubmit={submit}>
          <div className="form-row">
            <div className="form-field">
              <label>Subject Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Mathematics" autoFocus />
            </div>
            <div className="form-field">
              <label>Target Grade</label>
              <input value={targetGrade} onChange={(e) => setTargetGrade(e.target.value)} placeholder="e.g. A" />
            </div>
          </div>
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {SUBJECT_ICONS.map(ic => (
                <button key={ic} type="button" className={`icon-pick ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <button key={c} type="button" className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c, color: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary">Add Subject</button>
          </div>
        </form>
      )}

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {subjects.map(s => {
            const mins = getStudyTime(s.id)
            const pct = getTaskProgress(s.id)
            return (
              <div key={s.id} className="subject-card" style={{ '--subj-color': s.color }}>
                <div className="subject-card-top" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}cc)` }}>
                  <span className="subject-card-icon">{s.icon}</span>
                  <button className="subject-delete" onClick={(e) => { e.stopPropagation(); remove(s.id) }}>×</button>
                </div>
                <div className="subject-card-body" onClick={() => onNavigate?.('subject-detail', s.id)}>
                  <h3 className="subject-card-name">{s.name}</h3>
                  {s.target_grade && <div className="subject-card-grade">Target: {s.target_grade}</div>}
                  <div className="subject-card-stat">
                    <span>⏱️ {Math.floor(mins / 60)}h {mins % 60}m</span>
                  </div>
                  <div className="subject-card-progress">
                    <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%`, background: s.color }} /></div>
                    <span className="progress-label">{pct}% tasks done</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
