import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FocusPage.css'

const PRESETS = [15, 25, 45, 60]

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Focus() {
  const { subjects, sessions, refresh, addXp, unlockAchievement } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState('')
  const [justSaved, setJustSaved] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const [ambient, setAmbient] = useState(null)
  const intervalRef = useRef(null)
  const swRef = useRef(0)

  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) setSelectedSubject(subjects[0].id)
  }, [subjects, selectedSubject])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          swRef.current += 1
          setRemaining(swRef.current)
        } else {
          setRemaining(prev => {
            if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); return 0 }
            return prev - 1
          })
        }
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const setPreset = (min) => {
    setDuration(min * 60); setRemaining(min * 60); setRunning(false)
  }

  const handleStart = () => {
    if (mode === 'stopwatch') { swRef.current = remaining; setRunning(true) }
    else { if (remaining === 0) setRemaining(duration); setRunning(true) }
  }

  const handleReset = () => {
    setRunning(false)
    if (mode === 'stopwatch') { swRef.current = 0; setRemaining(0) }
    else setRemaining(duration)
  }

  const saveSession = useCallback(async () => {
    if (!selectedSubject) return
    const mins = mode === 'stopwatch' ? Math.round(swRef.current / 60) : Math.round((duration - remaining) / 60)
    if (mins < 1) return
    const { error } = await supabase.from('study_sessions').insert({
      subject_id: selectedSubject, duration_minutes: mins,
      session_date: todayStr(), session_type: mode, notes: notes.trim() || null,
    })
    if (!error) {
      await addXp(XP_REWARDS.study_session + (mode === 'pomodoro' ? XP_REWARDS.pomodoro : 0))
      await unlockAchievement('first_session')
      setNotes(''); setJustSaved(true)
      setTimeout(() => setJustSaved(false), 3000)
      refresh()
    }
  }, [selectedSubject, mode, duration, remaining, notes, addXp, unlockAchievement, refresh])

  const elapsed = mode === 'stopwatch' ? remaining : (duration - remaining)
  const progress = mode === 'stopwatch' ? 0 : duration > 0 ? (elapsed / duration) * 100 : 0
  const elapsedMin = Math.round(elapsed / 60)
  const subjectColor = subjects.find(s => s.id === selectedSubject)?.color || 'var(--primary)'
  const subjectName = subjects.find(s => s.id === selectedSubject)?.name || ''

  const todaySessions = sessions.filter(s => s.session_date === todayStr())
  const todayMin = todaySessions.reduce((sum, s) => sum + s.duration_minutes, 0)

  const ambientOptions = [
    { id: 'lofi', label: '🎵 Lofi', emoji: '🎵' },
    { id: 'rain', label: '🌧️ Rain', emoji: '🌧️' },
    { id: 'forest', label: '🌲 Forest', emoji: '🌲' },
    { id: 'none', label: '🔇 None', emoji: '🔇' },
  ]

  return (
    <div className={`focus-page ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="page-toolbar">
        <p className="page-desc">Focus with a Pomodoro timer, stopwatch, or countdown. Log sessions to earn XP.</p>
      </div>

      <div className="focus-modes">
        {['pomodoro', 'stopwatch', 'countdown'].map(m => (
          <button key={m} className={`focus-mode-btn ${mode === m ? 'active' : ''}`} onClick={() => {
            setMode(m); setRunning(false)
            if (m === 'stopwatch') { swRef.current = 0; setRemaining(0) }
            else if (m === 'countdown') { setDuration(25 * 60); setRemaining(25 * 60) }
            else { setDuration(25 * 60); setRemaining(25 * 60) }
          }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="focus-main">
        <div className="focus-ring-wrap">
          <svg viewBox="0 0 240 240" className="focus-ring">
            <circle cx="120" cy="120" r="106" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
            <circle cx="120" cy="120" r="106" fill="none" stroke={subjectColor} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 106}
              strokeDashoffset={mode === 'stopwatch' ? 0 : 2 * Math.PI * 106 * (1 - progress / 100)}
              transform="rotate(-90 120 120)"
              style={{ transition: 'stroke-dashoffset 0.5s ease, stroke 0.3s ease' }}
            />
          </svg>
          <div className="focus-center">
            <span className="focus-time">{fmt(remaining)}</span>
            <span className="focus-subject">{subjectName}</span>
          </div>
        </div>

        <div className="focus-controls">
          {!running ? (
            <button className="btn btn-primary focus-btn" onClick={handleStart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>Start
            </button>
          ) : (
            <button className="btn btn-primary focus-btn" onClick={() => setRunning(false)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>Pause
            </button>
          )}
          <button className="btn btn-outline focus-btn" onClick={handleReset}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>Reset
          </button>
          {elapsedMin >= 1 && !running && (
            <button className="btn focus-btn save-btn" onClick={saveSession}>
              {justSaved ? 'Saved!' : `Log ${elapsedMin}m`}
            </button>
          )}
          <button className="btn btn-ghost focus-btn" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          </button>
        </div>

        {mode !== 'stopwatch' && (
          <div className="focus-presets">
            {PRESETS.map(m => (
              <button key={m} className={`preset-chip ${duration === m * 60 ? 'active' : ''}`} onClick={() => setPreset(m)}>{m} min</button>
            ))}
          </div>
        )}

        <div className="focus-ambient">
          <span className="fa-label">Ambient sounds:</span>
          {ambientOptions.map(a => (
            <button key={a.id} className={`ambient-chip ${ambient === a.id ? 'active' : ''}`} onClick={() => setAmbient(ambient === a.id ? null : a.id)}>{a.label}</button>
          ))}
        </div>
      </div>

      <div className="focus-config">
        <div className="form-field">
          <label>Subject</label>
          <select value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <div className="form-field">
          <label>Session notes (optional)</label>
          <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="What are you studying?" />
        </div>
      </div>

      <div className="focus-today card">
        <div className="card-head">
          <h3>Today's Sessions</h3>
          <span className="ft-total">{Math.floor(todayMin / 60)}h {todayMin % 60}m</span>
        </div>
        {todaySessions.length === 0 ? (
          <p className="dash-empty">No sessions logged today. Start the timer!</p>
        ) : (
          <div className="ft-list">
            {todaySessions.map(s => {
              const subj = subjects.find(sub => sub.id === s.subject_id)
              return (
                <div key={s.id} className="ft-row">
                  <span className="ft-dot" style={{ background: subj?.color || 'var(--primary)' }} />
                  <span className="ft-subject">{subj?.name || 'Unknown'}</span>
                  <span className="ft-type">{s.session_type}</span>
                  {s.notes && <span className="ft-notes">{s.notes}</span>}
                  <span className="ft-mins">{s.duration_minutes}m</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
