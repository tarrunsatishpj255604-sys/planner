import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, tasks, sessions, loading, refresh, unlockAchievement } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const addSubject = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    const { error } = await supabase.from('subjects').insert({ name: name.trim(), color, icon, target_grade: targetGrade || null })
    if (!error) {
      if (subjects.length === 0) await unlockAchievement('subjects_1')
      if (subjects.length === 2) await unlockAchievement('subjects_3')
      setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade(''); setShowForm(false)
      refresh()
    }
    setSaving(false)
  }

  const deleteSubject = async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  const getStudyTime = (subjectId) => {
    return sessions.filter(s => s.subject_id === subjectId).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  }
  const getTaskProgress = (subjectId) => {
    const subTasks = tasks.filter(t => t.subject_id === subjectId)
    if (subTasks.length === 0) return { done: 0, total: 0, pct: 0 }
    const done = subTasks.filter(t => t.completed).length
    return { done, total: subTasks.length, pct: done / subTasks.length }
  }

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div><h2>Subjects</h2><p className="page-desc">Create and manage your study subjects. Click a subject to view notes, flashcards, tasks, and more.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add Subject'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Subject</h3></div>
          <div className="form-field">
            <label>Subject Name</label>
            <input type="text" placeholder="e.g. Mathematics" value={name} onChange={e => setName(e.target.value)} />
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
            <input type="text" placeholder="e.g. A+" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addSubject} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Create Subject'}</button>
          </div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)', fontSize: 28 }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to start organizing your studies.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {subjects.map(subj => {
            const studyMins = getStudyTime(subj.id)
            const tp = getTaskProgress(subj.id)
            return (
              <div key={subj.id} className="card subject-card" onClick={() => onNavigate('subject-detail', subj.id)}>
                <div className="subject-card-header" style={{ background: `linear-gradient(135deg, ${subj.color}, ${subj.color}dd)` }}>
                  <span className="subject-icon">{subj.icon || '📘'}</span>
                  {subj.target_grade && <span className="subject-target">Target: {subj.target_grade}</span>}
                </div>
                <div className="subject-card-body">
                  <h3 className="subject-name">{subj.name}</h3>
                  <div className="subject-stats">
                    <span className="ss-item">⏱️ {Math.floor(studyMins / 60)}h {studyMins % 60}m</span>
                    <span className="ss-item">✅ {tp.done}/{tp.total} tasks</span>
                  </div>
                  <div className="subject-progress">
                    <div className="subject-progress-bar" style={{ width: `${tp.pct * 100}%`, background: subj.color }} />
                  </div>
                  <div className="subject-card-actions">
                    <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onNavigate('subject-detail', subj.id) }}>Open →</button>
                    <button className="btn btn-ghost btn-sm del-btn" onClick={(e) => { e.stopPropagation(); deleteSubject(subj.id) }}>🗑️</button>
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
