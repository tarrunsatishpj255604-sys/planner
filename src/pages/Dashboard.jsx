import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, PRIORITY_CONFIG, todayStr } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, refresh, addXp } = useApp()
  const [quote, setQuote] = useState(null)
  const [quickNote, setQuickNote] = useState('')

  useEffect(() => {
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
  }, [])

  const today = todayStr()
  const todayTasks = tasks.filter(t => !t.completed && !t.archived && t.due_date === today)
  const upcomingExams = exams.filter(e => new Date(e.exam_date) >= new Date(today)).slice(0, 3)
  const streak = getStreak(sessions)
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile?.xp || 0)

  const todayMinutes = sessions.filter(s => s.session_date === today).reduce((sum, s) => sum + s.duration_minutes, 0)
  const dailyGoal = profile?.daily_goal_minutes || 120
  const goalPct = Math.min((todayMinutes / dailyGoal) * 100, 100)

  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + s.duration_minutes, 0)
    weekDays.push({ date: d, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
  }
  const maxWeekMin = Math.max(...weekDays.map(d => d.mins), 1)

  const toggleTask = async (t) => {
    await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id)
    if (!t.completed) {
      const xp = t.difficulty === 'hard' ? 40 : t.difficulty === 'medium' ? 25 : 15
      await addXp(xp)
    }
    refresh()
  }

  const addQuickNote = async () => {
    if (!quickNote.trim()) return
    await supabase.from('quick_notes').insert({ content: quickNote.trim() })
    setQuickNote('')
    refresh()
  }

  const delQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    refresh()
  }

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="wb-text">
          <h2>Hey {profile?.username || 'there'}!</h2>
          <p>{todayTasks.length > 0 ? `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today.` : 'No tasks due today — great progress!'}</p>
        </div>
        <div className="wb-streak">
          <span className="streak-icon">🔥</span>
          <div>
            <span className="streak-num">{streak}</span>
            <span className="streak-label">day streak</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card stat-mini">
          <div className="sm-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" /></svg>
          </div>
          <div>
            <span className="sm-val">{todayMinutes}m</span>
            <span className="sm-label">Studied today</span>
          </div>
        </div>
        <div className="card stat-mini">
          <div className="sm-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
          </div>
          <div>
            <span className="sm-val">{tasks.filter(t => t.completed).length}</span>
            <span className="sm-label">Tasks done</span>
          </div>
        </div>
        <div className="card stat-mini">
          <div className="sm-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </div>
          <div>
            <span className="sm-val">{subjects.length}</span>
            <span className="sm-label">Subjects</span>
          </div>
        </div>
        <div className="card stat-mini">
          <div className="sm-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </div>
          <div>
            <span className="sm-val">Lv {level}</span>
            <span className="sm-label">{currentLevelXp}/{nextLevelXp} XP</span>
          </div>
        </div>
      </div>

      <div className="dash-cols">
        <div className="dash-left">
          <div className="card">
            <div className="card-head">
              <h3>Today's Tasks</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button>
            </div>
            {todayTasks.length === 0 ? (
              <p className="dash-empty">No tasks due today. You're all caught up!</p>
            ) : (
              <div className="dash-task-list">
                {todayTasks.map(t => {
                  const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
                  return (
                    <div key={t.id} className="dash-task">
                      <button className="task-check" onClick={() => toggleTask(t)} />
                      <div className="dash-task-info">
                        <span className="dash-task-title">{t.title}</span>
                        {t.subject && <span className="dash-task-sub" style={{ color: t.subject.color }}>{t.subject.name}</span>}
                      </div>
                      <span className="dash-task-pri" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>Daily Goal</h3></div>
            <div className="daily-goal">
              <div className="dg-ring-wrap">
                <svg viewBox="0 0 120 120" className="dg-ring">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - goalPct / 100)}
                    transform="rotate(-90 60 60)"
                    style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                  />
                </svg>
                <div className="dg-center">
                  <span className="dg-pct">{Math.round(goalPct)}%</span>
                  <span className="dg-sub">{todayMinutes}m / {dailyGoal}m</span>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Quick Notes</h3></div>
            <div className="qn-input-row">
              <input
                type="text"
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addQuickNote()}
                placeholder="Jot something down…"
                className="qn-input"
              />
              <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
            </div>
            <div className="qn-list">
              {quickNotes.map(n => (
                <div key={n.id} className="qn-item">
                  <span>{n.content}</span>
                  <button className="qn-del" onClick={() => delQuickNote(n.id)}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                </div>
              ))}
              {quickNotes.length === 0 && <p className="dash-empty">No quick notes yet.</p>}
            </div>
          </div>
        </div>

        <div className="dash-right">
          <div className="card xp-card">
            <div className="card-head"><h3>XP & Level</h3></div>
            <div className="xp-info">
              <span className="xp-level-badge" style={{ background: 'var(--primary)' }}>Lv {level}</span>
              <div className="xp-bar-wrap">
                <div className="xp-bar">
                  <div className="xp-bar-fill" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
                </div>
                <span className="xp-text">{currentLevelXp} / {nextLevelXp} XP</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>This Week</h3></div>
            <div className="week-chart">
              {weekDays.map((d, i) => (
                <div key={i} className="week-bar-col">
                  <div className="week-bar-track">
                    <div className="week-bar-fill" style={{ height: `${(d.mins / maxWeekMin) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--surface-2)' }} />
                  </div>
                  <span className="week-bar-label">{d.label[0]}</span>
                  <span className="week-bar-mins">{d.mins > 0 ? `${d.mins}m` : ''}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Upcoming Exams</h3></div>
            {upcomingExams.length === 0 ? (
              <p className="dash-empty">No upcoming exams.</p>
            ) : (
              <div className="exam-list">
                {upcomingExams.map(e => (
                  <div key={e.id} className="exam-item">
                    <span className="exam-dot" style={{ background: e.subject?.color || 'var(--primary)' }} />
                    <div className="exam-info">
                      <span className="exam-title">{e.title}</span>
                      <span className="exam-date">{formatDate(e.exam_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {quote && (
            <div className="card quote-card" style={{ background: 'linear-gradient(135deg, var(--primary-l), var(--surface))' }}>
              <p className="quote-text">"{quote.quote}"</p>
              <span className="quote-author">— {quote.author}</span>
            </div>
          )}

          <button className="card focus-quick" onClick={() => onNavigate('focus')}>
            <span className="fq-icon">🍅</span>
            <div>
              <span className="fq-title">Start Focus Session</span>
              <span className="fq-sub">Pomodoro · Stopwatch · Countdown</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
