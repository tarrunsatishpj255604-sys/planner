import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FocusPage.css'

const PRESETS = [15, 25, 45, 60]
const SOUNDS = [
  { key: 'rain', label: 'Rain', icon: '🌧️' },
  { key: 'whitenoise', label: 'White Noise', icon: '📻' },
  { key: 'ocean', label: 'Ocean', icon: '🌊' },
  { key: 'cafe', label: 'Cafe', icon: '☕' },
  { key: 'birds', label: 'Birds', icon: '🐦' },
  { key: 'fireplace', label: 'Fireplace', icon: '🔥' },
]

export default function Focus() {
  const { subjects, sessions, refresh, addXp, unlockAchievement } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [activeSound, setActiveSound] = useState(null)
  const [volume, setVolume] = useState(0.5)
  const [logging, setLogging] = useState(false)

  const audioCtxRef = useRef(null)
  const soundNodesRef = useRef({})
  const birdTimerRef = useRef(null)
  const crackleTimerRef = useRef(null)
  const intervalRef = useRef(null)
  const startTimeRef = useRef(0)
  const elapsedRef = useRef(0)

  // Timer tick
  useEffect(() => {
    if (!running) return
    intervalRef.current = setInterval(() => {
      if (mode === 'stopwatch') {
        setRemaining(r => r + 1)
      } else {
        setRemaining(r => {
          if (r <= 1) { handleComplete(); return 0 }
          return r - 1
        })
      }
    }, 1000)
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`

  const playBell = useCallback(() => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
      const ctx = audioCtxRef.current
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.frequency.value = 800
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
      osc.connect(gain); gain.connect(ctx.destination)
      osc.start(); osc.stop(ctx.currentTime + 0.5)
    } catch (e) { /* ignore */ }
  }, [])

  const handleComplete = useCallback(() => {
    setRunning(false)
    playBell()
    // auto-log
    const mins = mode === 'stopwatch' ? Math.floor(elapsedRef.current / 60) : Math.floor(duration / 60)
    if (mins > 0) logSession(mins)
  }, [mode, duration, subjectId, notes])

  const logSession = async (mins) => {
    if (logging || mins <= 0) return
    setLogging(true)
    await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: mins, session_date: todayStr(), notes: notes.trim() || null })
    await addXp(XP_REWARDS.study_session)
    await unlockAchievement('first_session')
    refresh()
    setLogging(false)
  }

  const start = () => { if (mode === 'stopwatch') { setRemaining(0); elapsedRef.current = 0 } else { setRemaining(duration) } startTimeRef.current = Date.now(); setRunning(true) }
  const pause = () => setRunning(false)
  const reset = () => { setRunning(false); setRemaining(mode === 'stopwatch' ? 0 : duration) }

  const setPreset = (mins) => { setRunning(false); setDuration(mins * 60); setRemaining(mins * 60) }

  const switchMode = (m) => { setRunning(false); setMode(m); if (m === 'stopwatch') setRemaining(0); else setRemaining(duration) }

  const logManual = () => {
    const mins = mode === 'stopwatch' ? Math.floor(remaining / 60) : Math.floor((duration - remaining) / 60)
    logSession(Math.max(mins, 1))
    reset()
  }

  // ---- Web Audio sound system ----
  const ensureCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const makeNoiseBuffer = (ctx, type = 'white') => {
    const len = ctx.sampleRate * 2
    const buf = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buf.getChannelData(0)
    let last = 0
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1
      if (type === 'brown') { last = (last + 0.02 * white) / 1.02; data[i] = last * 3.5 }
      else data[i] = white
    }
    return buf
  }

  const stopSound = () => {
    const nodes = soundNodesRef.current
    Object.values(nodes).forEach(n => { try { n.stop && n.stop(); n.disconnect && n.disconnect() } catch (e) {} })
    if (birdTimerRef.current) { clearInterval(birdTimerRef.current); birdTimerRef.current = null }
    if (crackleTimerRef.current) { clearInterval(crackleTimerRef.current); crackleTimerRef.current = null }
    soundNodesRef.current = {}
    setActiveSound(null)
  }

  const playSound = (key) => {
    if (activeSound === key) { stopSound(); return }
    stopSound()
    const ctx = ensureCtx()
    const master = ctx.createGain()
    master.gain.value = volume
    master.connect(ctx.destination)
    const nodes = { master }

    if (key === 'rain') {
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'brown'); src.loop = true
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 1000
      src.connect(filter); filter.connect(master); src.start()
      nodes.src = src; nodes.filter = filter
    } else if (key === 'whitenoise') {
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'white'); src.loop = true
      src.connect(master); src.start()
      nodes.src = src
    } else if (key === 'ocean') {
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'white'); src.loop = true
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 800
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.1
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 400
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency); lfo.start()
      src.connect(filter); filter.connect(master); src.start()
      nodes.src = src; nodes.filter = filter; nodes.lfo = lfo
    } else if (key === 'cafe') {
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'brown'); src.loop = true
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.3
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.15
      const ampMod = ctx.createGain(); ampMod.gain.value = 0.85
      lfo.connect(lfoGain); lfoGain.connect(ampMod.gain); lfo.start()
      src.connect(ampMod); ampMod.connect(master); src.start()
      nodes.src = src; nodes.lfo = lfo; nodes.ampMod = ampMod
    } else if (key === 'birds') {
      // base soft noise + scheduled chirps
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'brown'); src.loop = true
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 600
      const birdGain = ctx.createGain(); birdGain.gain.value = 0.15
      src.connect(filter); filter.connect(birdGain); birdGain.connect(master); src.start()
      nodes.src = src; nodes.filter = filter
      const chirp = () => {
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.type = 'sine'; o.frequency.value = 2000 + Math.random() * 2000
        g.gain.setValueAtTime(0, ctx.currentTime)
        g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.2)
      }
      birdTimerRef.current = setInterval(() => { if (Math.random() > 0.4) chirp() }, 800)
    } else if (key === 'fireplace') {
      const src = ctx.createBufferSource(); src.buffer = makeNoiseBuffer(ctx, 'brown'); src.loop = true
      const filter = ctx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 500
      src.connect(filter); filter.connect(master); src.start()
      nodes.src = src; nodes.filter = filter
      const crackle = () => {
        const o = ctx.createBufferSource(); o.buffer = makeNoiseBuffer(ctx, 'white')
        const g = ctx.createGain(); const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2000
        g.gain.setValueAtTime(0.3, ctx.currentTime)
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
        o.connect(f); f.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime + 0.06)
      }
      crackleTimerRef.current = setInterval(() => { if (Math.random() > 0.5) crackle() }, 400)
    }

    soundNodesRef.current = nodes
    setActiveSound(key)
  }

  useEffect(() => { const m = soundNodesRef.current.master; if (m && audioCtxRef.current) m.gain.value = volume }, [volume])
  useEffect(() => () => stopSound(), [])

  const goFullscreen = () => { if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {}) }

  const todaySessions = sessions.filter(s => s.session_date === todayStr())
  const totalToday = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const ringR = 130, ringC = 2 * Math.PI * ringR
  const progress = mode === 'stopwatch' ? 0 : duration > 0 ? (duration - remaining) / duration : 0

  return (
    <div className="focus-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Focus Timer</h2><p className="page-desc">Stay focused with timers and ambient sounds.</p></div>
        <button className="btn btn-outline btn-sm" onClick={goFullscreen}>⛶ Fullscreen</button>
      </div>

      <div className="grid-2 focus-layout">
        <div className="focus-main">
          <div className="mode-tabs">
            <button className={`mode-tab ${mode === 'pomodoro' ? 'active' : ''}`} onClick={() => switchMode('pomodoro')}>Pomodoro</button>
            <button className={`mode-tab ${mode === 'stopwatch' ? 'active' : ''}`} onClick={() => switchMode('stopwatch')}>Stopwatch</button>
            <button className={`mode-tab ${mode === 'countdown' ? 'active' : ''}`} onClick={() => switchMode('countdown')}>Countdown</button>
          </div>

          {mode !== 'stopwatch' && (
            <div className="preset-row">
              {PRESETS.map(p => <button key={p} className={`preset-btn ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>)}
            </div>
          )}

          <div className="timer-ring-wrap">
            <svg width="300" height="300" viewBox="0 0 300 300" className="timer-ring">
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="14" />
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="url(#focusGrad)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progress)} transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 0.5s linear' }} />
              <defs><linearGradient id="focusGrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="var(--primary)" /><stop offset="100%" stopColor="var(--accent)" /></linearGradient></defs>
            </svg>
            <div className="timer-center">
              <span className="timer-display">{fmt(remaining)}</span>
              <span className="timer-mode">{mode}</span>
            </div>
          </div>

          <div className="timer-controls">
            {!running ? <button className="btn btn-primary timer-btn" onClick={start}>▶ Start</button> : <button className="btn btn-primary timer-btn" onClick={pause}>⏸ Pause</button>}
            <button className="btn btn-outline timer-btn" onClick={reset}>↺ Reset</button>
            <button className="btn btn-outline timer-btn" onClick={logManual} disabled={logging}>{logging ? 'Logging...' : '💾 Log Session'}</button>
          </div>

          <div className="focus-options">
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Session notes</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="What are you studying?" />
            </div>
          </div>
        </div>

        <div className="focus-side">
          <div className="card">
            <div className="card-head"><h3> Ambient Sounds</h3></div>
            <div className="sound-grid">
              {SOUNDS.map(s => (
                <button key={s.key} className={`sound-chip ${activeSound === s.key ? 'active' : ''}`} onClick={() => playSound(s.key)}>
                  <span className="sound-icon">{s.icon}</span><span className="sound-label">{s.label}</span>
                </button>
              ))}
            </div>
            <div className="volume-row">
              <label>Volume</label>
              <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
              <span className="vol-val">{Math.round(volume * 100)}%</span>
            </div>
            {activeSound && <button className="btn btn-ghost btn-sm sound-stop" onClick={stopSound}>Stop all sounds</button>}
          </div>

          <div className="card">
            <div className="card-head"><h3>Today's Sessions</h3><span className="fc-count">{todaySessions.length}</span></div>
            <div className="today-total">⏱️ {Math.floor(totalToday / 60)}h {totalToday % 60}m total today</div>
            {todaySessions.length === 0 ? <div className="dash-empty">No sessions yet today.</div> : (
              <div className="session-list">
                {todaySessions.map(s => (
                  <div key={s.id} className="session-item">
                    <span className="session-mins">{s.duration_minutes}m</span>
                    {s.subject && <span className="session-sub" style={{ color: s.subject.color }}>{s.subject.name}</span>}
                    {s.notes && <span className="session-note">{s.notes}</span>}
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
