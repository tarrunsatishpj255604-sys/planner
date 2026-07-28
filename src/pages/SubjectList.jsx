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
  const [grade, setGrade] = useState('')

  const addSubject = async () => {
    if (!name.trim()) return
    await supabase.from('subjects').insert({ name: name.trim(), color, target_grade: grade.trim() || null }).select().single()
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setGrade(''); setShowForm(false); refresh()
  }

  const deleteSubject = async (id) => {
    await supabase.from('subjects').delete().eq('id', id); refresh()
  }

  const getStudyTime = (subjectId) => sessions.filter(s => s.subject_id === subjectId).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const getTaskProgress = (subjectId) => {
    const subTasks = tasks.filter(t => t.subject_id === subjectId)
    if (subTasks.length === 0) return 0
    return Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100)
  }

  return (
    <div className="subject-page">
      <div className="page-toolbar">
        <div><h2>Subjects</h2><p className="page-desc">Create and manage your study subjects</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Subject'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <h3>New Subject</h3>
          <div className="form-field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" /></div>
          <div className="form-field"><label>Icon</label><div className="icon-picker">{SUBJECT_ICONS.map(ic => <button key={ic} className={`icon-btn ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>)}</div></div>
          <div className="form-field"><label>Color</label><div className="color-picker">{SUBJECT_COLORS.map(c => <div key={c} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setColor(c)} />)}</div></div>
          <div className="form-field"><label>Target Grade (optional)</label><input value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. A+" /></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={addSubject}>Create Subject</button></div>
        </div>
      )}

      {subjects.length === 0 && !showForm ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📚</div><h3>No subjects yet</h3><p>Create your first subject to get started.</p><button className="btn btn-primary" onClick={() => setShowForm(true)}>Add Subject</button></div>
      ) : (
        <div className="grid-3">
          {subjects.map(sub => {
            const studyTime = getStudyTime(sub.id)
            const taskPct = getTaskProgress(sub.id)
            return (
              <div key={sub.id} className="subject-card" onClick={() => onNavigate('subject-detail', sub.id)}>
                <div className="subject-card-top" style={{ background: `linear-gradient(135deg, ${sub.color}, ${sub.color}dd)` }}>
                  <span className="subject-icon">{SUBJECT_ICONS.includes(sub.icon) ? sub.icon : '📘'}</span>
                  <button className="subject-delete" onClick={(e) => { e.stopPropagation(); deleteSubject(sub.id) }}>×</button>
                </div>
                <div className="subject-card-body">
                  <h3>{sub.name}</h3>
                  {sub.target_grade && <span className="subject-grade">Target: {sub.target_grade}</span>}
                  <div className="subject-stats">
                    <span>⏱️ {Math.floor(studyTime / 60)}h {studyTime % 60}m</span>
                  </div>
                  <div className="subject-progress"><div className="subject-progress-bar" style={{ width: `${taskPct}%`, background: sub.color }} /></div>
                  <span className="subject-progress-label">{taskPct}% tasks done</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
