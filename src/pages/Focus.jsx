import { useState, useEffect, useRef, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS, todayStr } from '../lib/helpers.js'
import './FocusPage.css'

const PRESETS = [15, 25, 45, 60]
const SOUNDS = ['🌧️ Rain', '🔥 Fireplace', '🌊 Ocean', '☕ Café', '🌲 Forest', '🔇 Silence']

export default function Focus() {
  const { subjects, sessions, refresh, addXp } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [sessionNote, setSessionNote] = useState('')
  const [sound, setSound] = useState('🔇 Silence')
  const [fullscreen, setFullscreen] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        if (mode === 'stopwatch') {
          setElapsed(e => e + 1)
        } else {
          setRemaining(r => {
            if (r <= 1) { handleComplete(); return 0 }
            return r - 1
          })
        }
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => intervalRef.current && clearInterval(intervalRef.current)
  }, [running, mode])

  const setPreset = (mins) => {
    setDuration(mins * 60)
    setRemaining(mins * 60)
    setRunning(false)
  }

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => { setRunning(false); setRemaining(duration); setElapsed(0) }

  const handleComplete = async () => {
    setRunning(false)
    const mins = mode === 'stopwatch' ? Math.round(elapsed / 60) : Math.round(duration / 60)
    if (mins > 0) {
      const { data: u } = await supabase.auth.getUser()
      await supabase.from('study_sessions').insert({
        user_id: u.user.id, subject_id: subjectId || null, duration: mins, session_date: todayStr(), mode, notes: sessionNote,
      })
      await addXp(XP_REWARDS.study_session + (mode === 'pomodoro' ? XP_REWARDS.pomodoro : 0))
      refresh()
    }
    setRemaining(duration); setElapsed(0)
  }

  const logSession = async () => {
    const mins = mode === 'stopwatch' ? Math.max(1, Math.round(elapsed / 60)) : Math.max(1, Math.round((duration - remaining) / 60))
    if (mins < 1) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('study_sessions').insert({
      user_id: u.user.id, subject_id: subjectId || null, duration: mins, session_date: todayStr(), mode, notes: sessionNote,
    })
    await addXp(XP_REWARDS.study_session)
    refresh()
    setElapsed(0); setRemaining(duration)
  }

  const toggleFullscreen = () => {
    setFullscreen(!fullscreen)
    if (!fullscreen && containerRef.current?.requestFullscreen) containerRef.current.requestFullscreen()
    else if (document.fullscreenElement) document.exitFullscreen()
  }

  const displayTime = mode === 'stopwatch' ? elapsed : remaining
  const totalForRing = mode === 'stopwatch' ? Math.max(displayTime, 1) : duration
  const progress = mode === 'stopwatch' ? 1 : 1 - (remaining / duration)
  const ringR = 120, ringC = 2 * Math.PI * ringR

  const fmt = (s) => `${Math.floor(s / 3600)}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  const todaySessions = useMemo(() => sessions.filter(s => s.session_date === todayStr()), [sessions])

  return (
    <div className="focus-page" ref={containerRef}>
      <div className="page-toolbar">
        <div><h2>Focus</h2><p className="page-desc">Stay focused with the Pomodoro technique, a stopwatch, or countdown timer.</p></div>
        <button className="btn btn-outline btn-sm" onClick={toggleFullscreen}>{fullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}</button>
      </div>

      <div className="focus-modes">
        {['pomodoro', 'stopwatch', 'countdown'].map(m => (
          <button key={m} className={`filter-chip ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setRunning(false); if (m === 'stopwatch') setElapsed(0); else setRemaining(duration) }}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="focus-ring-wrap">
        <svg className="focus-ring" width="280" height="280" viewBox="0 0 280 280">
          <circle cx="140" cy="140" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
          <circle cx="140" cy="140" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
            strokeDasharray={ringC} strokeDashoffset={ringC - (ringC * progress)}
            transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
          <text x="140" y="138" textAnchor="middle" dominantBaseline="middle" className="focus-ring-time">{fmt(displayTime)}</text>
          <text x="140" y="162" textAnchor="middle" dominantBaseline="middle" className="focus-ring-label">{mode}</text>
        </svg>
      </div>

      {mode !== 'stopwatch' && (
        <div className="focus-presets">
          {PRESETS.map(p => (
            <button key={p} className={`filter-chip ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>
          ))}
        </div>
      )}

      <div className="focus-controls">
        {!running ? <button className="btn btn-primary" onClick={start}>▶ Start</button> : <button className="btn btn-primary" onClick={pause}>⏸ Pause</button>}
        <button className="btn btn-outline" onClick={reset}>↺ Reset</button>
        <button className="btn btn-outline" onClick={logSession}>💾 Log Session</button>
      </div>

      <div className="grid-2 focus-config">
        <div className="card">
          <div className="card-head"><h3>Session Settings</h3></div>
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">General Study</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Notes</label>
            <textarea value={sessionNote} onChange={(e) => setSessionNote(e.target.value)} placeholder="What are you working on?" rows={2} />
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Ambient Sound</h3></div>
          <div className="sound-chips">
            {SOUNDS.map(s => (
              <button key={s} className={`filter-chip ${sound === s ? 'active' : ''}`} onClick={() => setSound(s)}>{s}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Today's Sessions</h3></div>
        {todaySessions.length === 0 ? <div className="dash-empty">No sessions logged today.</div> : (
          <div className="focus-session-list">
            {todaySessions.map(s => (
              <div key={s.id} className="focus-session-item">
                <span className="fs-duration">{s.duration}m</span>
                {s.subject && <span className="fs-subject">{s.subject.icon} {s.subject.name}</span>}
                <span className="fs-mode">{s.mode || 'session'}</span>
                {s.notes && <span className="fs-notes">{s.notes}</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
