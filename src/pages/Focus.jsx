import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, formatDate, XP_REWARDS } from '../lib/helpers.js'
import './FocusPage.css'

export default function Focus() {
  const { subjects, sessions, addXp, unlockAchievement, refresh } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [activeSounds, setActiveSounds] = useState({})
  const [volume, setVolume] = useState(0.5)
  const audioCtxRef = useRef(null)
  const soundNodesRef = useRef({})
  const timerRef = useRef(null)

  useEffect(() => {
    if (running && remaining > 0) {
      timerRef.current = setTimeout(() => setRemaining(remaining - 1), 1000)
    } else if (running && remaining === 0) {
      setRunning(false)
      playBell()
      logSession()
    }
    return () => clearTimeout(timerRef.current)
  }, [running, remaining])

  useEffect(() => { if (!running) setRemaining(duration) }, [duration, running])

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60), s = sec % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const progress = duration > 0 ? ((duration - remaining) / duration) * 100 : 0

  const getAudioCtx = () => {
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    return audioCtxRef.current
  }

  const createNoiseBuffer = (ctx, type = 'white') => {
    const bufferSize = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    if (type === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    } else {
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
    }
    return buffer
  }

  const playBell = useCallback(() => {
    const ctx = getAudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  }, [])

  const startSound = (type) => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const nodes = {}
    const masterGain = ctx.createGain()
    masterGain.gain.value = volume
    masterGain.connect(ctx.destination)

    if (type === 'rain') {
      const source = ctx.createBufferSource()
      source.buffer = createNoiseBuffer(ctx, 'brown')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 1200
      source.connect(filter).connect(masterGain)
      source.start()
      nodes.source = source; nodes.gain = masterGain
    } else if (type === 'whitenoise') {
      const source = ctx.createBufferSource()
      source.buffer = createNoiseBuffer(ctx, 'white')
      source.loop = true
      source.connect(masterGain)
      source.start()
      nodes.source = source; nodes.gain = masterGain
    } else if (type === 'ocean') {
      const source = ctx.createBufferSource()
      source.buffer = createNoiseBuffer(ctx, 'white')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 500
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.1
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 300
      lfo.connect(lfoGain).connect(filter.frequency)
      source.connect(filter).connect(masterGain)
      source.start(); lfo.start()
      nodes.source = source; nodes.lfo = lfo; nodes.gain = masterGain
    } else if (type === 'cafe') {
      const source = ctx.createBufferSource()
      source.buffer = createNoiseBuffer(ctx, 'brown')
      source.loop = true
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.3
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.1
      const baseGain = ctx.createGain()
      baseGain.gain.value = 0.5
      lfo.connect(lfoGain).connect(baseGain.gain)
      source.connect(baseGain).connect(masterGain)
      source.start(); lfo.start()
      nodes.source = source; nodes.lfo = lfo; nodes.gain = masterGain
    } else if (type === 'fireplace') {
      const source = ctx.createBufferSource()
      source.buffer = createNoiseBuffer(ctx, 'brown')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.value = 800
      source.connect(filter).connect(masterGain)
      source.start()
      const crackle = setInterval(() => {
        const burst = ctx.createBufferSource()
        burst.buffer = createNoiseBuffer(ctx, 'white')
        const bg = ctx.createGain()
        bg.gain.setValueAtTime(0.15, ctx.currentTime)
        bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        burst.connect(bg).connect(masterGain)
        burst.start(); burst.stop(ctx.currentTime + 0.1)
      }, 800)
      nodes.source = source; nodes.gain = masterGain; nodes.crackle = crackle
    } else if (type === 'birds') {
      const chirp = () => {
        const osc = ctx.createOscillator()
        const og = ctx.createGain()
        osc.frequency.setValueAtTime(2000 + Math.random() * 1000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.1)
        og.gain.setValueAtTime(0.15, ctx.currentTime)
        og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.connect(og).connect(masterGain)
        osc.start(); osc.stop(ctx.currentTime + 0.15)
      }
      const interval = setInterval(() => { if (Math.random() > 0.5) chirp() }, 2000)
      chirp()
      nodes.gain = masterGain; nodes.interval = interval
    }
    soundNodesRef.current[type] = nodes
    setActiveSounds(prev => ({ ...prev, [type]: true }))
  }

  const stopSound = (type) => {
    const nodes = soundNodesRef.current[type]
    if (!nodes) return
    if (nodes.source) { try { nodes.source.stop() } catch(e){} }
    if (nodes.lfo) { try { nodes.lfo.stop() } catch(e){} }
    if (nodes.crackle) clearInterval(nodes.crackle)
    if (nodes.interval) clearInterval(nodes.interval)
    delete soundNodesRef.current[type]
    setActiveSounds(prev => ({ ...prev, [type]: false }))
  }

  const toggleSound = (type) => { activeSounds[type] ? stopSound(type) : startSound(type) }

  useEffect(() => { Object.values(soundNodesRef.current).forEach(n => { if (n.gain) n.gain.gain.value = volume }) }, [volume])

  useEffect(() => { return () => { Object.keys(soundNodesRef.current).forEach(stopSound) } }, [])

  const logSession = async () => {
    const minutes = Math.round((duration - remaining) / 60)
    if (minutes < 1) return
    await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: minutes, session_date: todayStr(), notes: notes.trim() || null }).select().single()
    addXp(XP_REWARDS.study_session)
    unlockAchievement('first_session')
    refresh()
  }

  const handleStart = () => { getAudioCtx(); setRunning(true) }
  const handlePause = () => { setRunning(false); logSession() }
  const handleReset = () => { setRunning(false); setRemaining(duration) }
  const handleFullscreen = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen() }

  const SOUNDS = [
    { key: 'rain', label: 'Rain', icon: '🌧️' },
    { key: 'whitenoise', label: 'White Noise', icon: '📻' },
    { key: 'ocean', label: 'Ocean', icon: '🌊' },
    { key: 'cafe', label: 'Cafe', icon: '☕' },
    { key: 'fireplace', label: 'Fireplace', icon: '🔥' },
    { key: 'birds', label: 'Birds', icon: '🐦' },
  ]

  const PRESETS = [15, 25, 45, 60]
  const todaySessions = sessions.filter(s => s.session_date === todayStr())

  return (
    <div className="focus-page">
      <div className="page-toolbar"><div><h2>Focus Timer</h2><p className="page-desc">Stay focused with ambient sounds and timers</p></div><button className="btn btn-ghost btn-sm" onClick={handleFullscreen}>⛶ Fullscreen</button></div>

      <div className="focus-modes">{['pomodoro','stopwatch','countdown'].map(m => <button key={m} className={`focus-mode-btn ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); setRunning(false); setDuration(m === 'stopwatch' ? 0 : m === 'countdown' ? 60*60 : 25*60) }}>{m.charAt(0).toUpperCase() + m.slice(1)}</button>)}</div>

      <div className="focus-ring-wrap">
        <svg className="focus-ring" width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="95" fill="none" stroke="var(--border)" strokeWidth="6" />
          <circle cx="110" cy="110" r="95" fill="none" stroke="var(--primary)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 95 * progress / 100} ${2 * Math.PI * 95}`} transform="rotate(-90 110 110)" />
        </svg>
        <div className="focus-time-display"><span className="focus-time">{mode === 'stopwatch' ? formatTime(duration - remaining) : formatTime(remaining)}</span><span className="focus-status">{running ? 'Running' : 'Paused'}</span></div>
      </div>

      {mode !== 'stopwatch' && <div className="focus-presets">{PRESETS.map(p => <button key={p} className={`preset-btn ${duration === p * 60 ? 'active' : ''}`} onClick={() => { setRunning(false); setDuration(p * 60) }}>{p}m</button>)}</div>}

      <div className="focus-controls">
        {!running ? <button className="btn btn-primary focus-start" onClick={handleStart}>Start</button> : <button className="btn btn-outline focus-pause" onClick={handlePause}>Pause & Log</button>}
        <button className="btn btn-ghost" onClick={handleReset}>Reset</button>
      </div>

      <div className="focus-config">
        <div className="form-field"><label>Subject</label><select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="form-field"><label>Session Notes</label><textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="What are you studying?" rows={2} /></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Ambient Sounds</h3></div>
        <div className="sound-chips">{SOUNDS.map(s => <button key={s.key} className={`sound-chip ${activeSounds[s.key] ? 'active' : ''}`} onClick={() => toggleSound(s.key)}><span className="sound-icon">{s.icon}</span><span>{s.label}</span></button>)}</div>
        <div className="volume-row"><label>Volume</label><input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} /><span>{Math.round(volume * 100)}%</span></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Today's Sessions</h3></div>
        {todaySessions.length === 0 ? <div className="dash-empty">No sessions logged today.</div> : <div className="focus-session-list">{todaySessions.map(s => <div key={s.id} className="focus-session-item"><span>⏱️ {s.duration_minutes} min</span>{s.subject && <span className="fs-sub">{s.subject.name}</span>}{s.notes && <span className="fs-notes">{s.notes}</span>}</div>)}</div>}
      </div>
    </div>
  )
}
