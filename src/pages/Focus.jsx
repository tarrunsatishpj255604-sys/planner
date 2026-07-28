import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS, todayStr } from '../lib/helpers.js'
import './FocusPage.css'

const PRESETS = [15, 25, 45, 60]
const AMBIENT = ['🌧️ Rain', '🌊 Ocean', '🔥 Fireplace', '☕ Cafe', '🌳 Forest', '🔇 Silence']

export default function Focus() {
  const { user, subjects, sessions, addXp, unlockAchievement, refresh } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [ambient, setAmbient] = useState('🔇 Silence')
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef(null)
  const intervalRef = useRef(null)
  const today = todayStr()

  const todaySessions = sessions.filter(s => s.session_date === today)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(r => {
          if (r <= 1) { handleComplete(); return 0 }
          return r - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [running])

  const handleComplete = useCallback(async () => {
    setRunning(false)
    const mins = Math.round((duration - remaining) / 60)
    if (mins > 0) {
      await supabase.from('study_sessions').insert({ user_id: user.id, subject_id: subjectId || null, duration: mins, session_date: today, mode })
      await addXp(XP_REWARDS.study_session)
      await unlockAchievement('first_session')
      refresh()
    }
  }, [duration, remaining, user, subjectId, mode, today, addXp, unlockAchievement, refresh])

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => { setRunning(false); setRemaining(duration) }

  const setPreset = (mins) => { setDuration(mins * 60); setRemaining(mins * 60); setRunning(false) }
  const switchMode = (m) => {
    setMode(m)
    if (m === 'pomodoro') { setDuration(25 * 60); setRemaining(25 * 60) }
    else if (m === 'countdown') { setDuration(15 * 60); setRemaining(15 * 60) }
    else { setRemaining(0) }
    setRunning(false)
  }

  const logSession = async () => {
    const mins = mode === 'stopwatch' ? Math.round(remaining / 60) : Math.round((duration - remaining) / 60)
    if (mins <= 0) return
    await supabase.from('study_sessions').insert({ user_id: user.id, subject_id: subjectId || null, duration: mins, session_date: today, mode })
    await addXp(XP_REWARDS.study_session)
    await unlockAchievement('first_session')
    reset()
    refresh()
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { containerRef.current?.requestFullscreen?.(); setFullscreen(true) }
    else { document.exitFullscreen?.(); setFullscreen(false) }
  }

  const displayTime = mode === 'stopwatch' ? remaining : remaining
  const mins = Math.floor(displayTime / 60)
  const secs = displayTime % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  const ringR = 130, ringC = 2 * Math.PI * ringR
  const progress = mode === 'stopwatch' ? 0 : duration > 0 ? (duration - remaining) / duration : 0

  return (
    <div className="focus-page" ref={containerRef}>
      <div className="page-toolbar">
        <div>
          <h2>Focus Timer</h2>
          <p className="page-desc">Stay focused with Pomodoro, stopwatch, and countdown modes. Earn XP for each session.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={toggleFullscreen}>
          {fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
        </button>
      </div>

      <div className="focus-main">
        <div className="focus-timer-card">
          <div className="focus-modes">
            {[['pomodoro', '🍅 Pomodoro'], ['stopwatch', '⏱️ Stopwatch'], ['countdown', '⏳ Countdown']].map(([key, label]) => (
              <button key={key} className={`focus-mode-btn ${mode === key ? 'active' : ''}`} onClick={() => switchMode(key)}>{label}</button>
            ))}
          </div>

          <div className="focus-ring-wrap">
            <svg className="focus-ring" viewBox="0 0 300 300">
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progress)} transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className="focus-ring-text">
              <span className="focus-time">{timeStr}</span>
              <span className="focus-mode-label">{mode}</span>
            </div>
          </div>

          <div className="focus-controls">
            {!running ? (
              <button className="btn btn-primary focus-start" onClick={start}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                Start
              </button>
            ) : (
              <button className="btn btn-primary focus-start" onClick={pause}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                Pause
              </button>
            )}
            <button className="btn btn-outline" onClick={reset}>Reset</button>
            <button className="btn btn-outline" onClick={logSession}>Log Session</button>
          </div>

          {mode !== 'stopwatch' && (
            <div className="focus-presets">
              {PRESETS.map(p => <button key={p} className={`focus-preset ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>)}
            </div>
          )}
        </div>

        <div className="focus-side">
          <div className="card">
            <div className="card-head"><h3>Session Settings</h3></div>
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Notes</label>
              <textarea rows={3} placeholder="What are you studying?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Ambient Sound</h3></div>
            <div className="ambient-chips">
              {AMBIENT.map(a => <button key={a} className={`ambient-chip ${ambient === a ? 'active' : ''}`} onClick={() => setAmbient(a)}>{a}</button>)}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Today's Sessions</h3></div>
            {todaySessions.length === 0 ? <p className="dash-empty">No sessions yet today.</p> : (
              <div className="focus-sess-list">
                {todaySessions.map(s => (
                  <div key={s.id} className="focus-sess-item">
                    <span className="fs-sub">{s.subject?.name || 'General'}</span>
                    <span className="fs-dur">{s.duration}m</span>
                    <span className="fs-mode">{s.mode}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
