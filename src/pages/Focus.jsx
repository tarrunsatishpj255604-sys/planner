import { useState, useEffect, useRef, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './FocusPage.css'

const PRESETS = [15, 25, 45, 60]
const SOUNDS = [
  { key: 'rain', label: '🌧️ Rain' },
  { key: 'white', label: '📻 White Noise' },
  { key: 'ocean', label: '🌊 Ocean' },
  { key: 'cafe', label: '☕ Cafe' },
  { key: 'birds', label: '🐦 Birds' },
  { key: 'fire', label: '🔥 Fireplace' },
]

export default function Focus() {
  const { subjects, sessions, loading, refresh, addXp, unlockAchievement } = useApp()
  const [mode, setMode] = useState('pomodoro')
  const [duration, setDuration] = useState(25 * 60)
  const [remaining, setRemaining] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [notes, setNotes] = useState('')
  const [activeSounds, setActiveSounds] = useState({})
  const [volume, setVolume] = useState(0.5)
  const [fullscreen, setFullscreen] = useState(false)
  const [logging, setLogging] = useState(false)

  const audioCtxRef = useRef(null)
  const soundNodesRef = useRef({})
  const intervalRef = useRef(null)
  const startTimeRef = useRef(0)
  const elapsedRef = useRef(0)

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    return audioCtxRef.current
  }, [])

  const stopSound = useCallback((key) => {
    const nodes = soundNodesRef.current[key]
    if (nodes) {
      Object.values(nodes).forEach(n => {
        try { if (n.stop) n.stop(); else if (n.disconnect) n.disconnect() } catch (e) {}
      })
      delete soundNodesRef.current[key]
    }
  }, [])

  const playSound = useCallback((key, vol) => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    stopSound(key)

    const master = ctx.createGain()
    master.gain.value = vol * 0.3
    master.connect(ctx.destination)

    if (key === 'rain') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer; noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 800
      noise.connect(filter); filter.connect(master); noise.start()
      soundNodesRef.current[key] = { noise, filter, master }
    } else if (key === 'white') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer; noise.loop = true
      noise.connect(master); noise.start()
      soundNodesRef.current[key] = { noise, master }
    } else if (key === 'ocean') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
      const noise = ctx.createBufferSource()
      noise.buffer = buffer; noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 500
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.15
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 300
      lfo.connect(lfoGain); lfoGain.connect(filter.frequency)
      noise.connect(filter); filter.connect(master)
      noise.start(); lfo.start()
      soundNodesRef.current[key] = { noise, filter, lfo, lfoGain, master }
    } else if (key === 'cafe') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer; noise.loop = true
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 0.3
      const lfoGain = ctx.createGain()
      lfoGain.gain.value = 0.3
      const ampMod = ctx.createGain()
      ampMod.gain.value = 0.7
      lfo.connect(lfoGain); lfoGain.connect(ampMod.gain)
      noise.connect(ampMod); ampMod.connect(master)
      noise.start(); lfo.start()
      soundNodesRef.current[key] = { noise, lfo, lfoGain, ampMod, master }
    } else if (key === 'birds') {
      const chirp = () => {
        if (!soundNodesRef.current[key]) return
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(1500 + Math.random() * 2000, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(2000 + Math.random() * 1000, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(0, ctx.currentTime)
        gain.gain.linearRampToValueAtTime(vol * 0.15, ctx.currentTime + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.connect(gain); gain.connect(master)
        osc.start(); osc.stop(ctx.currentTime + 0.2)
      }
      const interval = setInterval(chirp, 800 + Math.random() * 1500)
      chirp()
      soundNodesRef.current[key] = { master, interval }
    } else if (key === 'fire') {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer; noise.loop = true
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'; filter.frequency.value = 400
      noise.connect(filter); filter.connect(master); noise.start()
      const crackle = () => {
        if (!soundNodesRef.current[key]) return
        const burst = ctx.createBufferSource()
        const bs = ctx.sampleRate * 0.05
        const bbuf = ctx.createBuffer(1, bs, ctx.sampleRate)
        const bdata = bbuf.getChannelData(0)
        for (let i = 0; i < bs; i++) bdata[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bs * 0.3))
        burst.buffer = bbuf
        const bgain = ctx.createGain()
        bgain.gain.value = vol * 0.5
        burst.connect(bgain); bgain.connect(master)
        burst.start()
      }
      const interval = setInterval(crackle, 200 + Math.random() * 400)
      soundNodesRef.current[key] = { noise, filter, master, interval }
    }
  }, [getAudioCtx, stopSound])

  const toggleSound = (key) => {
    setActiveSounds(prev => {
      const next = { ...prev }
      if (next[key]) {
        stopSound(key)
        delete next[key]
      } else {
        next[key] = true
        playSound(key, volume)
      }
      return next
    })
  }

  useEffect(() => {
    Object.keys(activeSounds).forEach(key => {
      if (activeSounds[key]) {
        const nodes = soundNodesRef.current[key]
        if (nodes?.master) nodes.master.gain.value = volume * 0.3
      }
    })
  }, [volume, activeSounds])

  useEffect(() => {
    return () => {
      Object.keys(soundNodesRef.current).forEach(k => stopSound(k))
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [stopSound])

  const playBell = () => {
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 800
    osc.type = 'sine'
    gain.gain.setValueAtTime(0, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5)
    osc.connect(gain); gain.connect(ctx.destination)
    osc.start(); osc.stop(ctx.currentTime + 1.5)
  }

  const setPreset = (mins) => {
    if (running) return
    setDuration(mins * 60)
    setRemaining(mins * 60)
    elapsedRef.current = 0
  }

  const start = () => {
    if (running) return
    const ctx = getAudioCtx()
    if (ctx.state === 'suspended') ctx.resume()
    setRunning(true)
    startTimeRef.current = Date.now()
    if (mode === 'pomodoro' || mode === 'countdown') {
      intervalRef.current = setInterval(() => {
        const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000
        const rem = Math.max(duration - elapsed, 0)
        setRemaining(rem)
        if (rem <= 0) { finish() }
      }, 100)
    } else {
      intervalRef.current = setInterval(() => {
        const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000
        setRemaining(elapsed)
      }, 100)
    }
  }

  const pause = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    elapsedRef.current += (Date.now() - startTimeRef.current) / 1000
  }

  const reset = () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    elapsedRef.current = 0
    setRemaining(mode === 'stopwatch' ? 0 : duration)
  }

  const finish = useCallback(async () => {
    setRunning(false)
    if (intervalRef.current) clearInterval(intervalRef.current)
    playBell()
    const elapsed = elapsedRef.current + (Date.now() - startTimeRef.current) / 1000
    const minutes = Math.max(Math.round(elapsed / 60), 1)
    await logSession(minutes)
    elapsedRef.current = 0
    setRemaining(mode === 'stopwatch' ? 0 : duration)
  }, [duration, mode])

  const logSession = async (minutes) => {
    if (logging) return
    setLogging(true)
    await supabase.from('study_sessions').insert({ subject_id: subjectId || null, duration_minutes: minutes, session_date: todayStr(), notes: notes.trim() || null })
    await addXp(XP_REWARDS.study_session)
    await unlockAchievement('first_session')
    if (minutes >= 25) await unlockAchievement('focus_25')
    if (minutes >= 45) await unlockAchievement('focus_45')
    if (minutes >= 60) await unlockAchievement('focus_60')
    setNotes('')
    refresh()
    setLogging(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const formatTime = (sec) => {
    const s = Math.floor(sec)
    const m = Math.floor(s / 60)
    const h = Math.floor(m / 60)
    if (h > 0) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
    return `${m}:${String(s % 60).padStart(2, '0')}`
  }

  const ringR = 130, ringC = 2 * Math.PI * ringR
  const progress = mode === 'stopwatch' ? 0 : 1 - (remaining / duration)
  const todaySessions = sessions.filter(s => s.session_date === todayStr())

  return (
    <div className={`focus-page ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="page-toolbar">
        <div><h2>Focus Timer</h2><p className="page-desc">Stay focused with pomodoro, stopwatch, or countdown. Log sessions to earn XP.</p></div>
        <button className="btn btn-outline btn-sm" onClick={toggleFullscreen}>{fullscreen ? 'Exit Fullscreen' : '⛶ Fullscreen'}</button>
      </div>

      <div className="grid-2 focus-layout">
        <div className="card focus-main-card">
          <div className="focus-mode-tabs">
            <button className={`focus-mode-tab ${mode === 'pomodoro' ? 'active' : ''}`} onClick={() => { if (!running) { setMode('pomodoro'); setPreset(25) } }}>🍅 Pomodoro</button>
            <button className={`focus-mode-tab ${mode === 'stopwatch' ? 'active' : ''}`} onClick={() => { if (!running) { setMode('stopwatch'); setRunning(false); setRemaining(0); elapsedRef.current = 0 } }}>⏱️ Stopwatch</button>
            <button className={`focus-mode-tab ${mode === 'countdown' ? 'active' : ''}`} onClick={() => { if (!running) { setMode('countdown'); setPreset(15) } }}>⏳ Countdown</button>
          </div>

          <div className="focus-ring-wrap">
            <svg width="300" height="300" viewBox="0 0 300 300" className="focus-ring">
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="12" />
              <circle cx="150" cy="150" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="12" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - progress)} transform="rotate(-90 150 150)" style={{ transition: 'stroke-dashoffset 0.3s ease' }} />
            </svg>
            <div className="focus-time-display">
              <span className="focus-time">{formatTime(mode === 'stopwatch' ? remaining : remaining)}</span>
              <span className="focus-mode-label">{mode}</span>
            </div>
          </div>

          {(mode === 'pomodoro' || mode === 'countdown') && (
            <div className="focus-presets">
              {PRESETS.map(p => (
                <button key={p} className={`preset-btn ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)} disabled={running}>{p}m</button>
              ))}
            </div>
          )}

          <div className="focus-controls">
            {!running ? (
              <button className="btn btn-primary focus-start-btn" onClick={start}>▶ Start</button>
            ) : (
              <button className="btn btn-outline focus-pause-btn" onClick={pause}>⏸ Pause</button>
            )}
            <button className="btn btn-ghost" onClick={reset}>↺ Reset</button>
            <button className="btn btn-outline" onClick={() => finish()} disabled={logging}>✓ Log Session</button>
          </div>

          <div className="focus-session-config">
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-field">
              <label>Session Notes</label>
              <input type="text" placeholder="What are you studying?" value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card ambient-card">
          <div className="card-head"><h3>🔊 Ambient Sounds</h3></div>
          <div className="sound-chips">
            {SOUNDS.map(s => (
              <button key={s.key} className={`sound-chip ${activeSounds[s.key] ? 'active' : ''}`} onClick={() => toggleSound(s.key)}>
                {s.label}
                <span className="sound-indicator">{activeSounds[s.key] ? '●' : '○'}</span>
              </button>
            ))}
          </div>
          <div className="volume-control">
            <label>Master Volume</label>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
            <span className="vol-value">{Math.round(volume * 100)}%</span>
          </div>

          <div className="card-head" style={{ marginTop: 20 }}><h3>📋 Today's Sessions</h3></div>
          {todaySessions.length === 0 ? <div className="dash-empty">No sessions logged today.</div> : (
            <div className="today-sessions">
              {todaySessions.map(s => (
                <div key={s.id} className="ts-item">
                  <span className="ts-duration">{s.duration_minutes}m</span>
                  <span className="ts-subject">{s.subject?.name || 'General'}</span>
                  {s.notes && <span className="ts-notes">{s.notes}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
