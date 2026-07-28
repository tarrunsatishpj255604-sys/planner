import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, tasks, sessions, refresh, loading } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)

  const subjectStats = useMemo(() => {
    const map = {}
    for (const s of subjects || []) {
      const subTasks = (tasks || []).filter(t => t.subject_id === s.id)
      const done = subTasks.filter(t => t.completed).length
      const total = subTasks.length
      const mins = (sessions || []).filter(ss => ss.subject_id === s.id).reduce((sum, ss) => sum + (ss.duration_minutes || 0), 0)
      map[s.id] = { done, total, mins }
    }
    return map
  }, [subjects, tasks, sessions])

  const addSubject = async () => {
    if (!name.trim()) return
    setSaving(true)
    const { data, error } = await supabase.from('subjects').insert({ name: name.trim(), icon, color, target_grade: targetGrade || null }).select().single()
    if (!error && data) { setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade(''); setShowForm(false); refresh() }
    setSaving(false)
  }

  const deleteSubject = async (id, e) => {
    e.stopPropagation()
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div><h2>Subjects</h2><p className="page-desc">Manage your subjects and track progress.</p></div>
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
                <button key={ic} className={`icon-swatch ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
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
            <button className="btn btn-primary" onClick={addSubject} disabled={saving || !name.trim()}>{saving ? 'Saving...' : 'Add Subject'}</button>
          </div>
        </div>
      )}

      {(subjects || []).length === 0 && !showForm ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)' }}>📚</div>
          <h3>No subjects yet</h3>
          <p>Add your first subject to start tracking your study progress.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subject-grid">
          {(subjects || []).map(s => {
            const stats = subjectStats[s.id] || { done: 0, total: 0, mins: 0 }
            const progress = stats.total > 0 ? (stats.done / stats.total) * 100 : 0
            return (
              <div key={s.id} className="card subject-card" onClick={() => onNavigate('subject-detail', s.id)} style={{ borderTop: `4px solid ${s.color}` }}>
                <div className="subject-card-head">
                  <span className="subject-icon" style={{ background: `${s.color}22` }}>{s.icon}</span>
                  <button className="btn btn-ghost btn-sm subject-delete" onClick={(e) => deleteSubject(s.id, e)}>✕</button>
                </div>
                <h3 className="subject-name">{s.name}</h3>
                {s.target_grade && <span className="subject-grade" style={{ color: s.color }}>Target: {s.target_grade}</span>}
                <div className="subject-time">⏱️ {Math.floor(stats.mins / 60)}h {stats.mins % 60}m studied</div>
                <div className="subject-progress">
                  <div className="subject-progress-bar"><div className="subject-progress-fill" style={{ width: `${progress}%`, background: s.color }} /></div>
                  <span className="subject-progress-text">{stats.done}/{stats.total} tasks</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
