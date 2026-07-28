import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './FocusPage.css'

const MODES = { pomodoro: 'Pomodoro', stopwatch: 'Stopwatch', countdown: 'Countdown' }
const PRESETS = [15, 25, 45, 60]
const SOUNDS = ['🌧️ Rain', '🔥 Fireplace', '🌊 Ocean', '☕ Cafe', '🌳 Forest', '🔇 Silence']

export default function Focus() {
  const { subjects, sessions, refresh, addXp, unlockAchievement, loading } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [ambient, setAmbient] = useState('🔇 Silence')
  const [fullscreen, setFullscreen] = useState(false)
  const containerRef = useRef(null)
  const intervalRef = useRef(null)
  const today = todayStr()

  const todaySessions = (sessions || []).filter(s => s.session_date === today)

  useEffect(() => {
    if (mode === 'pomodoro') { setDuration(25); setRemaining(25 * 60) }
    else if (mode === 'countdown') { setDuration(15); setRemaining(15 * 60) }
    else { setRemaining(0) }
    setRunning(false)
  }, [mode])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setRemaining(prev => {
          if (mode === 'stopwatch') return prev + 1
          if (prev <= 1) { clearInterval(intervalRef.current); setRunning(false); handleComplete(); return 0 }
          return prev - 1
        })
      }, 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, mode])

  const handleComplete = useCallback(async () => {
    await logSession(true)
  }, [])

  const logSession = async (auto = false) => {
    const elapsed = mode === 'stopwatch' ? remaining : duration - remaining
    if (elapsed < 1 && !auto) return
    const mins = Math.max(1, Math.round(elapsed / 60))
    await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: mins, session_date: today, mode, notes })
    await addXp(XP_REWARDS.study_session + (mode === 'pomodoro' ? XP_REWARDS.pomodoro : 0))
    unlockAchievement('first_session')
    const pomodoroCount = (sessions || []).filter(s => s.mode === 'pomodoro').length + (mode === 'pomodoro' ? 1 : 0)
    if (pomodoroCount >= 10) unlockAchievement('pomodoro_10')
    const totalMins = (sessions || []).reduce((sum, s) => sum + s.duration_minutes, 0) + mins
    if (totalMins >= 600) unlockAchievement('hours_10')
    if (totalMins >= 3000) unlockAchievement('hours_50')
    refresh()
    if (mode !== 'stopwatch') { setRemaining(duration * 60) }
    setRunning(false)
  }

  const start = () => setRunning(true)
  const pause = () => setRunning(false)
  const reset = () => { setRunning(false); setRemaining(mode === 'stopwatch' ? 0 : duration * 60) }

  const setPreset = (mins) => { setDuration(mins); setRemaining(mins * 60); setRunning(false) }

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) { await containerRef.current?.requestFullscreen?.(); setFullscreen(true) }
    else { await document.exitFullscreen?.(); setFullscreen(false) }
  }

  const ringR = 130, ringC = 2 * Math.PI * ringR
  const displayTime = mode === 'stopwatch' ? remaining : remaining
  const progress = mode === 'stopwatch' ? 0 : duration > 0 ? 1 - remaining / (duration * 60) : 0
  const mm = Math.floor(displayTime / 60).toString().padStart(2, '0')
  const ss = (displayTime % 60).toString().padStart(2, '0')

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="focus-page" ref={containerRef}>
      <div className="page-toolbar">
        <div><h2>Focus</h2><p className="page-desc">Stay focused and track your study sessions.</p></div>
        <button className="btn btn-outline btn-sm" onClick={toggleFullscreen}>⛶ Fullscreen</button>
      </div>

      <div className="focus-main">
        <div className="focus-modes">
          {Object.entries(MODES).map(([k, v]) => <button key={k} className={`focus-mode ${mode === k ? 'active' : ''}`} onClick={() => setMode(k)}>{v}</button>)}
        </div>

        <div className="focus-ring-wrap">
          <svg width="300" height="300" viewBox="0 0 300 300" className="focus-ring">
            <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
            <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="14" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progress)} transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
            <text x="150" y="150" textAnchor="middle" className="focus-time">{mm}:{ss}</text>
            <text x="150" y="178" textAnchor="middle" className="focus-mode-label">{MODES[mode]}</text>
          </svg>
        </div>

        {mode !== 'stopwatch' && (
          <div className="focus-presets">
            {PRESETS.map(p => <button key={p} className={`focus-preset ${duration === p ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>)}
          </div>
        )}

        <div className="focus-controls">
          {!running ? <button className="btn btn-primary focus-btn" onClick={start}>▶ Start</button> : <button className="btn btn-primary focus-btn" onClick={pause}>⏸ Pause</button>}
          <button className="btn btn-outline focus-btn" onClick={reset}>↺ Reset</button>
          <button className="btn btn-outline focus-btn" onClick={() => logSession(false)} disabled={mode === 'stopwatch' ? remaining < 1 : remaining === duration * 60}>💾 Log Session</button>
        </div>

        <div className="focus-ambient">
          {SOUNDS.map(s => <button key={s} className={`filter-chip ${ambient === s ? 'active' : ''}`} onClick={() => setAmbient(s)}>{s}</button>)}
        </div>

        <div className="grid-2 focus-config">
          <div className="form-field"><label>Subject</label><select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">General Study</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
          <div className="form-field"><label>Session Notes</label><input type="text" placeholder="What are you studying?" value={notes} onChange={e => setNotes(e.target.value)} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Today's Sessions</h3><span className="fc-count">{todaySessions.length}</span></div>
        {todaySessions.length === 0 ? <div className="dash-empty">No sessions logged today. Start studying! 📚</div> : (
          <div className="focus-sessions">
            {todaySessions.map(s => (
              <div key={s.id} className="focus-session-item">
                <span className="fs-icon">{s.mode === 'pomodoro' ? '🍅' : s.mode === 'countdown' ? '⏳' : '⏱️'}</span>
                <div className="fs-info"><span className="fs-title">{s.duration_minutes}m · {s.mode}</span>{s.subject && <span className="fs-subject">{s.subject.icon} {s.subject.name}</span>}{s.notes && <span className="fs-notes">{s.notes}</span>}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
