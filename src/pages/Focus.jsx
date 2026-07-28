import { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { XP_REWARDS, todayStr } from '../lib/helpers.js';
import './FocusPage.css';

const PRESETS = [15, 25, 45, 60];
const SOUNDS = ['🌧️ Rain', '🌊 Ocean', '🔥 Fireplace', '☕ Café', '🌲 Forest', '🔇 Silence'];

export default function Focus() {
  const { profile, subjects, sessions, refresh, addXp, unlockAchievement } = useApp();
  const [mode, setMode] = useState('pomodoro'); // pomodoro | stopwatch | countdown
  const [duration, setDuration] = useState(25 * 60); // seconds
  const [remaining, setRemaining] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [note, setNote] = useState('');
  const [sound, setSound] = useState('🔇 Silence');
  const [fullscreen, setFullscreen] = useState(false);
  const intervalRef = useRef(null);
  const startRef = useRef(null);

  useEffect(() => {
    if (!running) return;
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (mode === 'stopwatch') return prev + 1;
        if (prev <= 1) { handleComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [running, mode]);

  const handleComplete = useCallback(async () => {
    setRunning(false);
    const elapsed = mode === 'stopwatch' ? remaining : duration;
    await logSession(elapsed);
  }, [remaining, duration, mode]);

  const logSession = async (secs) => {
    const minutes = Math.round(secs / 60);
    if (minutes <= 0) return;
    try {
      await supabase.from('study_sessions').insert({
        user_id: profile?.id, subject_id: subjectId || null,
        duration: minutes, date: todayStr(), notes: note, mode,
      });
      await addXp((XP_REWARDS.focus_minute || 2) * minutes);
      if (unlockAchievement) await unlockAchievement('first_focus');
      refresh();
    } catch (e) { console.error(e); }
  };

  const start = () => { startRef.current = Date.now(); setRunning(true); };
  const pause = () => setRunning(false);
  const reset = () => { setRunning(false); setRemaining(mode === 'stopwatch' ? 0 : duration); };

  const setPreset = (min) => { setDuration(min * 60); setRemaining(min * 60); setRunning(false); };

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    if (m === 'stopwatch') setRemaining(0);
    else setRemaining(duration);
  };

  const total = mode === 'stopwatch' ? Math.max(remaining, 60) : duration;
  const pct = mode === 'stopwatch' ? 0 : (1 - remaining / duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const dashOffset = circumference - (pct / 100) * circumference;

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');

  const todaySessions = (sessions || []).filter(s => (s.date || s.created_at || '').slice(0, 10) === todayStr());

  return (
    <div className={`focus-page ${fullscreen ? 'fullscreen' : ''}`}>
      <div className="page-toolbar">
        <div><h2>Focus</h2><p className="page-desc">Stay on track with timed sessions</p></div>
        <button className="btn btn-outline btn-sm" onClick={() => setFullscreen(f => !f)}>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</button>
      </div>

      <div className="focus-main">
        <div className="mode-tabs">
          {['pomodoro','stopwatch','countdown'].map(m => (
            <button key={m} className={`mode-tab ${mode === m ? 'active' : ''}`} onClick={() => switchMode(m)}>{m[0].toUpperCase() + m.slice(1)}</button>
          ))}
        </div>

        <div className="timer-ring">
          <svg width="280" height="280" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r="120" fill="none" stroke="var(--bg-3, #e5e7eb)" strokeWidth="12" />
            <circle cx="140" cy="140" r="120" fill="none" stroke="var(--primary, #6366f1)" strokeWidth="12" strokeLinecap="round"
              strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 140 140)" />
            <text x="140" y="145" textAnchor="middle" fontSize="48" fontWeight="700" fill="currentColor">{mm}:{ss}</text>
          </svg>
        </div>

        {mode !== 'stopwatch' && (
          <div className="presets">
            {PRESETS.map(p => (
              <button key={p} className={`preset ${duration === p * 60 ? 'active' : ''}`} onClick={() => setPreset(p)}>{p}m</button>
            ))}
          </div>
        )}

        <div className="timer-controls">
          {!running ? <button className="btn btn-primary" onClick={start}>Start</button> : <button className="btn btn-primary" onClick={pause}>Pause</button>}
          <button className="btn btn-ghost" onClick={reset}>Reset</button>
          <button className="btn btn-outline" onClick={() => logSession(mode === 'stopwatch' ? remaining : duration - remaining)}>Log Session</button>
        </div>

        <div className="sound-chips">
          {SOUNDS.map(s => (
            <button key={s} className={`sound-chip ${sound === s ? 'active' : ''}`} onClick={() => setSound(s)}>{s}</button>
          ))}
        </div>

        <div className="focus-options">
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">General</option>
              {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Notes</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="What are you working on?" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Today’s Sessions</h3></div>
        {todaySessions.length === 0 ? (
          <div className="empty-state"><p>No sessions yet today</p></div>
        ) : (
          <ul className="session-list">
            {todaySessions.map(s => (
              <li key={s.id}>
                <span>{(subjects || []).find(x => x.id === s.subject_id)?.name || 'General'}</span>
                <span>{s.duration}m</span>
                <span className="muted">{s.mode}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
