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
  const [targetGrade, setTargetGrade] = useState('')

  const taskProgress = (subjectId) => {
    const sub = tasks.filter(t => t.subject_id === subjectId)
    if (sub.length === 0) return 0
    return Math.round((sub.filter(t => t.completed).length / sub.length) * 100)
  }

  const studyTime = (subjectId) => {
    return sessions.filter(s => s.subject_id === subjectId).reduce((a, s) => a + (s.duration || 0), 0)
  }

  const addSubject = async () => {
    if (!name.trim()) return
    await supabase.from('subjects').insert({ user_id: user.id, name: name.trim(), icon, color, target_grade: targetGrade.trim() || null })
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade(''); setShowForm(false)
    refresh()
  }

  const deleteSubject = async (e, id) => {
    e.stopPropagation()
    if (!confirm('Delete this subject? All related tasks, notes, and flashcards will remain.')) return
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div>
          <h2>Subjects</h2>
          <p className="page-desc">Create subjects to organize your tasks, notes, flashcards, and study sessions.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Subject'}
        </button>
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
                <button key={ic} className={`icon-option ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <div key={c} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Target Grade (optional)</label>
            <input type="text" placeholder="e.g. A" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addSubject}>Create Subject</button>
          </div>
        </div>
      )}

      {subjects.length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {subjects.map(s => {
            const prog = taskProgress(s.id)
            const time = studyTime(s.id)
            return (
              <div key={s.id} className="subject-card" onClick={() => onNavigate('subject-detail', s.id)} style={{ borderTopColor: s.color }}>
                <div className="sc-top">
                  <div className="sc-icon" style={{ background: s.color + '20' }}>{s.icon || '📘'}</div>
                  <button className="sc-delete" onClick={(e) => deleteSubject(e, s.id)}>🗑️</button>
                </div>
                <h3 className="sc-name">{s.name}</h3>
                {s.target_grade && <span className="sc-grade">Target: {s.target_grade}</span>}
                <div className="sc-stats">
                  <span className="sc-stat">⏱️ {Math.round(time)}m</span>
                  <span className="sc-stat">📋 {tasks.filter(t => t.subject_id === s.id).length}</span>
                </div>
                <div className="sc-progress">
                  <div className="sc-progress-bar"><div className="sc-progress-fill" style={{ width: `${prog}%`, background: s.color }} /></div>
                  <span className="sc-progress-label">{prog}% done</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
