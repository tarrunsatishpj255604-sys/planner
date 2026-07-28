import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './Subjects.css'

const COLORS = [
  '#4f7cff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6',
  '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#6366f1',
]

export default function Subjects({ subjects, onRefresh }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [targetGrade, setTargetGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setName('')
    setColor(COLORS[0])
    setTargetGrade('')
    setEditing(null)
    setError('')
    setShowForm(false)
  }

  const startEdit = (s) => {
    setEditing(s)
    setName(s.name)
    setColor(s.color)
    setTargetGrade(s.target_grade || '')
    setShowForm(true)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('Subject name is required.')
      return
    }
    setSaving(true)
    setError('')
    try {
      if (editing) {
        const { error } = await supabase
          .from('subjects')
          .update({ name: name.trim(), color, target_grade: targetGrade.trim() || null })
          .eq('id', editing.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('subjects')
          .insert({ name: name.trim(), color, target_grade: targetGrade.trim() || null })
        if (error) throw error
      }
      resetForm()
      onRefresh()
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject? All tasks and study sessions linked to it will also be removed.')) return
    try {
      await supabase.from('subjects').delete().eq('id', id)
      onRefresh()
    } catch {
      // ignore
    }
  }

  return (
    <div className="subjects-page">
      <div className="page-toolbar">
        <p className="page-desc">Add your courses and set target grades to keep your goals in sight.</p>
        {!showForm && (
          <button className="btn btn-primary btn-sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add subject
          </button>
        )}
      </div>

      {showForm && (
        <form className="subject-form" onSubmit={handleSubmit}>
          <div className="sf-head">
            <h3>{editing ? 'Edit subject' : 'New subject'}</h3>
            <button type="button" className="auth-close" onClick={resetForm}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {error && <div className="auth-error">{error}</div>}
          <div className="sf-row">
            <div className="sf-field" style={{ flex: 2 }}>
              <label>Subject name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics"
                autoFocus
                disabled={saving}
              />
            </div>
            <div className="sf-field" style={{ flex: 1 }}>
              <label>Target grade</label>
              <input
                type="text"
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                placeholder="e.g. A"
                disabled={saving}
              />
            </div>
          </div>
          <div className="sf-field">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          <div className="sf-actions">
            <button type="button" className="btn btn-ghost btn-sm" onClick={resetForm}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving && <span className="spinner" />}
              {saving ? 'Saving…' : (editing ? 'Save changes' : 'Add subject')}
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
          <p>Add your first subject to start organizing your study plan.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Add your first subject</button>
        </div>
      ) : (
        <div className="subject-grid">
          {subjects.map((s) => (
            <div key={s.id} className="subject-card" style={{ borderTopColor: s.color }}>
              <div className="sc-head">
                <span className="sc-dot" style={{ background: s.color }} />
                <h3>{s.name}</h3>
              </div>
              {s.target_grade && (
                <div className="sc-grade">
                  <span className="sc-grade-label">Target</span>
                  <span className="sc-grade-value">{s.target_grade}</span>
                </div>
              )}
              <div className="sc-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Edit
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => handleDelete(s.id)}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
