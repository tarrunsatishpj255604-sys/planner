import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SubjectList.css'

export default function SubjectList({ onNavigate }) {
  const { subjects, tasks, sessions, loading, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [icon, setIcon] = useState(SUBJECT_ICONS[0])
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    await supabase.from('subjects').insert({ name: name.trim(), color, target_grade: targetGrade.trim() || null })
    setName(''); setIcon(SUBJECT_ICONS[0]); setColor(SUBJECT_COLORS[0]); setTargetGrade(''); setShowForm(false); setSaving(false)
    refresh()
  }

  const del = async (id) => {
    await supabase.from('subjects').delete().eq('id', id)
    refresh()
  }

  const studyTime = (sid) => sessions.filter(s => s.subject_id === sid).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const taskProgress = (sid) => {
    const st = tasks.filter(t => t.subject_id === sid)
    if (st.length === 0) return 0
    return Math.round((st.filter(t => t.completed).length / st.length) * 100)
  }

  if (loading) return <div className="subj-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="subject-list">
      <div className="page-toolbar">
        <div><h2 className="page-title">Subjects</h2><p className="page-desc">Organize your studies by subject.</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add Subject'}</button>
      </div>

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Subject</h3></div>
          <div className="form-field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" /></div>
          <div className="form-field"><label>Icon</label>
            <div className="icon-picker">{SUBJECT_ICONS.map(ic => (
              <button key={ic} className={`icon-swatch ${icon === ic ? 'selected' : ''}`} onClick={() => setIcon(ic)}>{ic}</button>
            ))}</div>
          </div>
          <div className="form-field"><label>Color</label>
            <div className="color-picker">{SUBJECT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${color === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setColor(c)} />
            ))}</div>
          </div>
          <div className="form-field"><label>Target Grade (optional)</label><input value={targetGrade} onChange={e => setTargetGrade(e.target.value)} placeholder="e.g. A" /></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={submit} disabled={!name.trim() || saving}>{saving ? 'Saving...' : 'Create Subject'}</button></div>
        </div>
      )}

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📚</div>
          <h3>No subjects yet</h3><p>Create your first subject to get started.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Subject</button>
        </div>
      ) : (
        <div className="grid-3 subj-grid">
          {subjects.map(s => {
            const time = studyTime(s.id)
            const prog = taskProgress(s.id)
            return (
              <div key={s.id} className="card subj-card" onClick={() => onNavigate('subject-detail', s.id)}>
                <div className="subj-card-top" style={{ background: `linear-gradient(135deg, ${s.color}22, transparent)` }}>
                  <span className="subj-icon" style={{ background: s.color }}>{s.icon || '📘'}</span>
                  <button className="subj-del" onClick={(e) => { e.stopPropagation(); del(s.id) }}>×</button>
                </div>
                <h3 className="subj-name">{s.name}</h3>
                {s.target_grade && <span className="subj-grade">Target: {s.target_grade}</span>}
                <div className="subj-stat"><span>⏱️ {Math.floor(time / 60)}h {time % 60}m</span></div>
                <div className="subj-prog-wrap">
                  <div className="subj-prog-label">Tasks {prog}%</div>
                  <div className="subj-prog-track"><div className="subj-prog-fill" style={{ width: `${prog}%`, background: s.color }} /></div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
