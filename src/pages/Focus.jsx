import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FocusPage.css'

const MODES = [
  { key: 'pomodoro', label: 'Pomodoro', defaultMins: 25 },
  { key: 'stopwatch', label: 'Stopwatch', defaultMins: 0 },
  { key: 'countdown', label: 'Countdown', defaultMins: 45 },
]
const PRESETS = [15, 25, 45, 60]
const SOUNDS = [
  { key: 'lofi', label: '🎵 Lofi' },
  { key: 'rain', label: '🌧️ Rain' },
  { key: 'forest', label: '🌲 Forest' },
  { key: 'none', label: '🔇 None' },
]

export default function Focus() {
  const { user, subjects, sessions, refresh, addXp, unlockAchievement } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [sound, setSound] = useState('none')
  const [fullscreen, setFullscreen] = useState(false)
  const [busy, setBusy] = useState(false)
  const intervalRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setElapsed(e => e + 1)
        } else {
          setRemaining(r => {
            if (r <= 1) {
              setRunning(false)
              return 0
            }
            return r - 1
          })
        }
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [running, mode])

  const selectMode = (m) => {
    const def = MODES.find(x => x.key === m)
    setMode(m); setRunning(false)
    if (m === 'stopwatch') { setElapsed(0) }
    else { setDuration(def.defaultMins * 60); setRemaining(def.defaultMins * 60) }
  }

  const setPreset = (mins) => {
    setDuration(mins * 60); setRemaining(mins * 60); setRunning(false)
  }

  const reset = () => {
    setRunning(false)
    if (mode === 'stopwatch') setElapsed(0)
    else setRemaining(duration)
  }

  const toggleFullscreen = () => {
    const el = containerRef.current
    if (!document.fullscreenElement) {
      el?.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false))
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const displayTime = mode === 'stopwatch' ? elapsed : remaining
  const progress = mode === 'stopwatch'
    ? 0
    : duration > 0 ? ((duration - remaining) / duration) : 0

  const logSession = async () => {
    const mins = mode === 'stopwatch' ? Math.round(elapsed / 60) : Math.round((duration - remaining) / 60)
    if (mins < 1) return
    setBusy(true)
    await supabase.from('study_sessions').insert({
      user_id: user.id,
      subject_id: subjectId || null,
      session_date: todayStr(),
      duration: mins * 60,
      notes: notes.trim() || null,
      mode,
    })
    await addXp(XP_REWARDS.study_session)
    if (mode === 'pomodoro') {
      await addXp(XP_REWARDS.pomodoro)
      await unlockAchievement('pomodoro_10')
    }
    await unlockAchievement('first_session')
    setNotes(''); setRunning(false)
    if (mode === 'stopwatch') setElapsed(0); else setRemaining(duration)
    setBusy(false); refresh()
  }

  const todaySessions = sessions.filter(s => s.session_date === todayStr())

  const fmt = (s) => {
    const h = Math.floor(s / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return h > 0
      ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
      : `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const ringR = 130
  const circ = 2 * Math.PI * ringR

  return (
    <div className="focus-page" ref={containerRef}>
      <div className="page-toolbar">
        <div>
          <h2>Focus</h2>
          <p className="page-desc">Stay productive with a timer. Log sessions to earn XP.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={toggleFullscreen}>
          {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <div className="focus-main">
        <div className="focus-modes">
          {MODES.map(m => (
            <button key={m.key} className={`focus-mode-btn ${mode === m.key ? 'active' : ''}`} onClick={() => selectMode(m.key)}>{m.label}</button>
          ))}
        </div>

        <div className="focus-ring-wrap">
          <svg className="focus-ring" viewBox="0 0 300 300">
            <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
            <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={circ * (1 - progress)}
              transform="rotate(-90 150 150)" />
          </svg>
          <div className="focus-ring-text">
            <span className="focus-time">{fmt(displayTime)}</span>
            <span className="focus-mode-label">{mode === 'stopwatch' ? 'elapsed' : 'remaining'}</span>
          </div>
        </div>

        {mode !== 'stopwatch' && (
          <div className="focus-presets">
            {PRESETS.map(p => (
              <button key={p} className={`focus-preset ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>
            ))}
          </div>
        )}

        <div className="focus-controls">
          <button className="btn btn-primary focus-start" onClick={() => setRunning(r => !r)}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="btn btn-outline" onClick={reset}>↻ Reset</button>
          <button className="btn btn-ghost" onClick={logSession} disabled={busy}>Log Session</button>
        </div>

        <div className="focus-options">
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Session notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What are you working on?" />
          </div>
        </div>

        <div className="focus-sounds">
          <span className="focus-sounds-label">Ambient sound:</span>
          {SOUNDS.map(s => (
            <button key={s.key} className={`filter-chip ${sound === s.key ? 'active' : ''}`} onClick={() => setSound(s.key)}>{s.label}</button>
          ))}
        </div>
      </div>

      <div className="card focus-sessions">
        <div className="card-head"><h3>Today's Sessions</h3></div>
        {todaySessions.length === 0 ? (
          <p className="dash-empty">No sessions logged today. Start one above!</p>
        ) : (
          <ul className="focus-session-list">
            {todaySessions.map(s => (
              <li key={s.id} className="focus-session-item">
                <span className="fs-mode">{s.mode || 'session'}</span>
                <span className="fs-dur">{Math.floor((s.duration || 0) / 60)}m</span>
                {s.subject && <span className="fs-subject" style={{ background: s.subject.color + '22', color: s.subject.color }}>{s.subject.icon} {s.subject.name}</span>}
                {s.notes && <span className="fs-notes">{s.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
