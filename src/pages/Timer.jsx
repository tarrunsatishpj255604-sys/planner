import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './Timer.css'

const PRESETS = [15, 25, 45, 60]

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function Timer({ subjects, sessions, onRefresh }) {
  const [selectedSubject, setSelectedSubject] = useState('')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].id)
    }
  }, [subjects, selectedSubject])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current)
            setRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const setPreset = (min) => {
    setDuration(min * 60)
    setRemaining(min * 60)
    setRunning(false)
  }

  const handleStart = () => {
    if (remaining === 0) setRemaining(duration)
    setRunning(true)
  }

  const handlePause = () => setRunning(false)

  const handleReset = () => {
    setRunning(false)
    setRemaining(duration)
  }

  const saveSession = useCallback(async () => {
    if (!selectedSubject) return
    const elapsedMin = Math.round((duration - remaining) / 60)
    if (elapsedMin < 1) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('study_sessions')
        .insert({
          subject_id: selectedSubject,
          duration_minutes: elapsedMin,
          session_date: todayStr(),
          notes: notes.trim() || null,
        })
      if (error) throw error
      setNotes('')
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
      onRefresh()
    } catch {
      // ignore
    } finally {
      setSaving(false)
    }
  }, [selectedSubject, duration, remaining, notes, onRefresh])

  const elapsed = duration - remaining
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0
  const elapsedMin = Math.round(elapsed / 60)

  const todaySessions = sessions.filter((s) => s.session_date === todayStr())
  const todayMin = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const todayHrs = Math.floor(todayMin / 60)
  const todayRem = todayMin % 60

  const subjectName = subjects.find((s) => s.id === selectedSubject)?.name || ''
  const subjectColor = subjects.find((s) => s.id === selectedSubject)?.color || 'var(--primary)'

  return (
    <div className="timer-page">
      <div className="page-toolbar">
        <p className="page-desc">Start a focus timer, pick a subject, and log your study session when you're done.</p>
      </div>

      {subjects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>
          </div>
          <h3>Add a subject first</h3>
          <p>You need at least one subject to start a study session.</p>
        </div>
      ) : (
        <>
          <div className="timer-main">
            <div className="timer-display">
              <div className="timer-ring-wrap">
                <svg className="timer-ring" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="88" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                  <circle
                    cx="100" cy="100" r="88" fill="none"
                    stroke={subjectColor} strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={2 * Math.PI * 88 * (1 - progress / 100)}
                    transform="rotate(-90 100 100)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
                  />
                </svg>
                <div className="timer-center">
                  <span className="timer-time">{formatTime(remaining)}</span>
                  <span className="timer-subject">{subjectName}</span>
                </div>
              </div>
            </div>

            <div className="timer-controls">
              {!running ? (
                <button className="btn btn-primary timer-btn" onClick={handleStart} disabled={remaining === 0 && duration === 0}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  Start
                </button>
              ) : (
                <button className="btn btn-primary timer-btn" onClick={handlePause}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
                  Pause
                </button>
              )}
              <button className="btn btn-outline timer-btn" onClick={handleReset}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
                Reset
              </button>
              {elapsedMin >= 1 && !running && (
                <button className="btn timer-btn save-btn" onClick={saveSession} disabled={saving}>
                  {saving && <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />}
                  {justSaved ? 'Saved!' : `Log ${elapsedMin}m session`}
                </button>
              )}
            </div>

            <div className="timer-presets">
              {PRESETS.map((m) => (
                <button
                  key={m}
                  className={`preset-chip ${duration === m * 60 ? 'active' : ''}`}
                  onClick={() => setPreset(m)}
                >
                  {m} min
                </button>
              ))}
            </div>
          </div>

          <div className="timer-config">
            <div className="sf-field">
              <label>Subject</label>
              <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none', background: 'var(--surface)' }}>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="sf-field">
              <label>Session notes (optional)</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="What did you study?"
                style={{ padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', outline: 'none' }}
              />
            </div>
          </div>

          <div className="timer-today">
            <div className="tt-head">
              <h3>Today's study time</h3>
              <span className="tt-total">{todayHrs}h {todayRem}m</span>
            </div>
            {todaySessions.length === 0 ? (
              <p className="tt-empty">No sessions logged today. Start the timer above!</p>
            ) : (
              <div className="tt-list">
                {todaySessions.map((s) => {
                  const subj = subjects.find((sub) => sub.id === s.subject_id)
                  return (
                    <div key={s.id} className="tt-row">
                      <span className="tt-dot" style={{ background: subj?.color || 'var(--primary)' }} />
                      <span className="tt-subject">{subj?.name || 'Unknown'}</span>
                      {s.notes && <span className="tt-notes">{s.notes}</span>}
                      <span className="tt-mins">{s.duration_minutes}m</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
