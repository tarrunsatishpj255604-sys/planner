import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FocusPage.css'

const SOUNDS = [
  { key: 'rain', label: '🌧️ Rain' },
  { key: 'white', label: '⚪ White Noise' },
  { key: 'ocean', label: '🌊 Ocean' },
  { key: 'cafe', label: '☕ Cafe' },
  { key: 'birds', label: '🐦 Birds' },
  { key: 'fireplace', label: '🔥 Fireplace' },
]

const PRESETS = [15, 25, 45, 60]

export default function Focus() {
  const { subjects, sessions, loading, refresh, addXp, unlockAchievement } = useApp()
  const [mode, setMode] = useState('pomodoro') // pomodoro | stopwatch | countdown
  const [duration, setDuration] = useState(25 * 60) // seconds for pomodoro/countdown
  const [elapsed, setElapsed] = useState(0) // seconds elapsed (stopwatch) or remaining
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [activeSounds, setActiveSounds] = useState({})
  const [volume, setVolume] = useState(0.5)

  const audioCtxRef = useRef(null)
  const soundNodesRef = useRef({})
  const intervalRef = useRef(null)
  const volumeRef = useRef(volume)
  volumeRef.current = volume

  const today = todayStr()
  const todaySessions = sessions.filter(s => s.session_date === today)

  // Timer logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsed(prev => {
          if (mode === 'stopwatch') return prev + 1
          // pomodoro/countdown count down
          if (prev <= 1) {
            playBell()
            autoLog()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }
    return () => clearInterval(intervalRef.current)
  }, [running, mode])

  // When mode changes, reset
  useEffect(() => {
    setRunning(false)
    if (mode === 'stopwatch') setElapsed(0)
    else setElapsed(duration)
  }, [mode])

  // When duration preset changes (only if not running)
  useEffect(() => {
    if (!running && mode !== 'stopwatch') setElapsed(duration)
  }, [duration])

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
    } catch (e) { /* noop */ }
  }, [])

  const autoLog = useCallback(async () => {
    setRunning(false)
    const mins = Math.round(duration / 60)
    if (mins > 0) {
      await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: mins, session_date: todayStr(), notes: notes.trim() || null })
      await addXp(XP_REWARDS.pomodoro)
      await unlockAchievement('first_session')
      refresh()
    }
  }, [duration, subjectId, notes, addXp, unlockAchievement, refresh])

  // ---- Web Audio Sound System ----
  const ensureCtx = () => {
    if (!audioCtxRef.current) {
      try { audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)() } catch (e) { return null }
    }
    if (audioCtxRef.current.state === 'suspended') audioCtxRef.current.resume()
    return audioCtxRef.current
  }

  const makeNoiseBuffer = (ctx, type = 'white') => {
    const len = ctx.sampleRate * 2
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    if (type === 'white') {
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1
    } else {
      // brown noise
      let last = 0
      for (let i = 0; i < len; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (last + 0.02 * white) / 1.02
        last = data[i]
        data[i] *= 3.5
      }
    }
    return buffer
  }

  const stopSound = (key) => {
    const nodes = soundNodesRef.current[key]
    if (!nodes) return
    if (nodes.gain) nodes.gain.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.05)
    setTimeout(() => {
      try { nodes.source?.stop() } catch (e) {}
      try { nodes.lfo?.stop() } catch (e) {}
      try { nodes.lfoGain?.disconnect() } catch (e) {}
      try { nodes.amOsc?.stop() } catch (e) {}
      try { nodes.chirpTimer && clearInterval(nodes.chirpTimer) } catch (e) {}
      Object.values(nodes).forEach(n => { try { n?.disconnect?.() } catch (e) {} })
    }, 100)
    delete soundNodesRef.current[key]
  }

  const startSound = (key) => {
    const ctx = ensureCtx()
    if (!ctx) return
    const masterGain = ctx.createGain()
    masterGain.gain.value = volumeRef.current
    masterGain.connect(ctx.destination)

    if (key === 'rain') {
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 1000
      const gain = ctx.createGain(); gain.gain.value = 1
      source.connect(filter); filter.connect(gain); gain.connect(masterGain)
      source.start()
      soundNodesRef.current[key] = { source, filter, gain, masterGain }
    } else if (key === 'white') {
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'white')
      source.loop = true
      const gain = ctx.createGain(); gain.gain.value = 0.5
      source.connect(gain); gain.connect(masterGain)
      source.start()
      soundNodesRef.current[key] = { source, gain, masterGain }
    } else if (key === 'ocean') {
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'white')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 500
      // LFO modulating filter freq
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.1
      const lfoGain = ctx.createGain(); lfoGain.gain.value = 300
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency)
      const gain = ctx.createGain(); gain.gain.value = 0.8
      source.connect(filter); filter.connect(gain); gain.connect(masterGain)
      source.start(); lfo.start()
      soundNodesRef.current[key] = { source, filter, gain, lfo, lfoGain, masterGain }
    } else if (key === 'cafe') {
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      source.loop = true
      const gain = ctx.createGain(); gain.gain.value = 0.8
      // amplitude modulation
      const amOsc = ctx.createOscillator()
      amOsc.frequency.value = 0.3
      const amGain = ctx.createGain(); amGain.gain.value = 0.2
      amOsc.connect(amGain); amGain.connect(gain.gain)
      source.connect(gain); gain.connect(masterGain)
      source.start(); amOsc.start()
      soundNodesRef.current[key] = { source, gain, amOsc, amGain, masterGain }
    } else if (key === 'birds') {
      // brown noise base + occasional chirps
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 2000
      const gain = ctx.createGain(); gain.gain.value = 0.3
      source.connect(filter); filter.connect(gain); gain.connect(masterGain)
      source.start()
      // chirp scheduler
      const chirpTimer = setInterval(() => {
        if (Math.random() > 0.6) {
          const osc = ctx.createOscillator()
          const og = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(2000 + Math.random() * 2000, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(3000 + Math.random() * 2000, ctx.currentTime + 0.1)
          og.gain.setValueAtTime(0.15, ctx.currentTime)
          og.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
          osc.connect(og); og.connect(masterGain)
          osc.start(); osc.stop(ctx.currentTime + 0.15)
        }
      }, 2000)
      soundNodesRef.current[key] = { source, filter, gain, chirpTimer, masterGain }
    } else if (key === 'fireplace') {
      const source = ctx.createBufferSource()
      source.buffer = makeNoiseBuffer(ctx, 'brown')
      source.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 800
      const gain = ctx.createGain(); gain.gain.value = 0.8
      source.connect(filter); filter.connect(gain); gain.connect(masterGain)
      source.start()
      // crackling: random short noise bursts
      const chirpTimer = setInterval(() => {
        if (Math.random() > 0.5) {
          const burst = ctx.createBufferSource()
          burst.buffer = makeNoiseBuffer(ctx, 'white')
          const bg = ctx.createGain()
          bg.gain.setValueAtTime(0.2, ctx.currentTime)
          bg.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
          const bf = ctx.createBiquadFilter()
          bf.type = 'highpass'; bf.frequency.value = 2000
          burst.connect(bf); bf.connect(bg); bg.connect(masterGain)
          burst.start(); burst.stop(ctx.currentTime + 0.05)
        }
      }, 500)
      soundNodesRef.current[key] = { source, filter, gain, chirpTimer, masterGain }
    }
  }

  const toggleSound = (key) => {
    if (activeSounds[key]) {
      stopSound(key)
      setActiveSounds(prev => { const n = { ...prev }; delete n[key]; return n })
    } else {
      startSound(key)
      setActiveSounds(prev => ({ ...prev, [key]: true }))
    }
  }

  // Update volume on all active sounds
  useEffect(() => {
    Object.values(soundNodesRef.current).forEach(nodes => {
      if (nodes.masterGain && audioCtxRef.current) {
        nodes.masterGain.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.05)
      }
    })
  }, [volume])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.keys(soundNodesRef.current).forEach(stopSound)
      if (audioCtxRef.current) { try { audioCtxRef.current.close() } catch (e) {} }
      clearInterval(intervalRef.current)
    }
  }, [])

  const toggleTimer = () => {
    if (mode !== 'stopwatch' && elapsed === 0) {
      setElapsed(duration)
    }
    setRunning(!running)
  }

  const resetTimer = () => {
    setRunning(false)
    if (mode === 'stopwatch') setElapsed(0)
    else setElapsed(duration)
  }

  const logSession = async () => {
    let mins
    if (mode === 'stopwatch') mins = Math.round(elapsed / 60)
    else mins = Math.round((duration - elapsed) / 60)
    if (mins <= 0) return
    await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: mins, session_date: todayStr(), notes: notes.trim() || null })
    await addXp(XP_REWARDS.study_session)
    await unlockAchievement('first_session')
    setNotes('')
    refresh()
  }

  const goFullscreen = () => {
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen()
    else if (document.documentElement.webkitRequestFullscreen) document.documentElement.webkitRequestFullscreen()
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  // Progress ring
  const total = mode === 'stopwatch' ? Math.max(elapsed, 1) : duration
  const progress = mode === 'stopwatch' ? (elapsed % 60) / 60 : (duration - elapsed) / duration
  const R = 120, C = 2 * Math.PI * R

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="focus-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Focus Timer</h2>
          <p className="page-desc">Stay focused with Pomodoro, stopwatch, and countdown modes.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={goFullscreen}>⛶ Fullscreen</button>
      </div>

      <div className="focus-layout">
        <div className="card focus-timer-card">
          <div className="focus-mode-tabs">
            <button className={`focus-mode-tab ${mode === 'pomodoro' ? 'active' : ''}`} onClick={() => setMode('pomodoro')}>Pomodoro</button>
            <button className={`focus-mode-tab ${mode === 'stopwatch' ? 'active' : ''}`} onClick={() => setMode('stopwatch')}>Stopwatch</button>
            <button className={`focus-mode-tab ${mode === 'countdown' ? 'active' : ''}`} onClick={() => setMode('countdown')}>Countdown</button>
          </div>

          {mode !== 'stopwatch' && (
            <div className="focus-presets">
              {PRESETS.map(p => (
                <button key={p} className={`focus-preset ${duration === p * 60 ? 'active' : ''}`} onClick={() => setDuration(p * 60)}>{p}m</button>
              ))}
            </div>
          )}

          <div className="focus-ring-wrap">
            <svg width="280" height="280" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r={R} fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="140" cy="140" r={R} fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 140 140)" style={{ transition: 'stroke-dashoffset 1s linear' }} />
            </svg>
            <div className="focus-ring-center">
              <span className="focus-timer-display">{formatTime(mode === 'stopwatch' ? elapsed : elapsed)}</span>
              <span className="focus-timer-label">{running ? 'Running' : 'Paused'}</span>
            </div>
          </div>

          <div className="focus-controls">
            <button className="btn btn-primary focus-btn" onClick={toggleTimer}>{running ? 'Pause' : 'Start'}</button>
            <button className="btn btn-outline focus-btn" onClick={resetTimer}>Reset</button>
            <button className="btn btn-outline focus-btn" onClick={logSession}>Log Session</button>
          </div>

          <div className="focus-session-form">
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Session Notes</label>
              <textarea placeholder="What are you studying?" value={notes} onChange={e => setNotes(e.target.value)} rows="2" />
            </div>
          </div>
        </div>

        <div className="card focus-sounds-card">
          <div className="card-head"><h3>🔊 Ambient Sounds</h3></div>
          <p className="focus-sounds-desc">Generated in real-time — no audio files needed.</p>
          <div className="sound-chips">
            {SOUNDS.map(s => (
              <button key={s.key} className={`sound-chip ${activeSounds[s.key] ? 'active' : ''}`} onClick={() => toggleSound(s.key)}>
                {s.label}
                {activeSounds[s.key] && <span className="sound-pulse" />}
              </button>
            ))}
          </div>
          <div className="sound-volume">
            <label>Master Volume</label>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
          </div>
        </div>

        <div className="card focus-today-card">
          <div className="card-head"><h3>Today's Sessions</h3></div>
          {todaySessions.length === 0 ? <div className="dash-empty">No sessions logged today.</div> : (
            <div className="focus-session-list">
              {todaySessions.map(s => (
                <div key={s.id} className="focus-session-item">
                  <span className="focus-session-time">{s.duration_minutes}m</span>
                  <div><strong>{s.subject?.name || 'General Study'}</strong>{s.notes && <span className="focus-session-notes">{s.notes}</span>}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
