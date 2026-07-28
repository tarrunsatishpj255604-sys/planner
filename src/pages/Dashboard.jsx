import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { user, profile, subjects, tasks, sessions, exams, quickNotes, refresh, addXp } = useApp()
  const [quote, setQuote] = useState(null)
  const [qnText, setQnText] = useState('')
  const [qnBusy, setQnBusy] = useState(false)

  const today = todayStr()
  const streak = getStreak(sessions)
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile?.xp || 0)

  const studiedToday = useMemo(() => {
    return sessions.filter(s => s.session_date === today).reduce((sum, s) => sum + (s.duration || 0), 0)
  }, [sessions, today])

  const todayTasks = useMemo(() => {
    return tasks.filter(t => !t.archived && t.due_date === today)
  }, [tasks, today])

  const tasksDoneToday = useMemo(() => todayTasks.filter(t => t.completed).length, [todayTasks])
  const dailyGoal = profile?.daily_goal_minutes || 120
  const goalPct = Math.min(100, Math.round((studiedToday / dailyGoal) * 100))

  const upcomingExams = useMemo(() => {
    return exams.filter(e => e.exam_date >= today).slice(0, 4)
  }, [exams, today])

  const weeklyData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration || 0), 0)
      days.push({ date: ds, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [sessions])

  const maxWeekly = Math.max(60, ...weeklyData.map(d => d.mins))

  useEffect(() => {
    let active = true
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (active && data && data.length) {
        setQuote(data[Math.floor(Math.random() * data.length)])
      }
    })
    return () => { active = false }
  }, [])

  const toggleTask = async (task) => {
    const completed = !task.completed
    await supabase.from('tasks').update({ completed }).eq('id', task.id)
    if (completed) await addXp(XP_REWARDS.task_complete)
    refresh()
  }

  const addQuickNote = async () => {
    if (!qnText.trim() || qnBusy) return
    setQnBusy(true)
    const { data } = await supabase.from('quick_notes').insert({ user_id: user.id, content: qnText.trim() }).select().single()
    if (data) setQnText('')
    setQnBusy(false)
    refresh()
  }

  const deleteQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    refresh()
  }

  if (!profile) return <div className="spinner" />

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div className="welcome-bg" />
        <div className="welcome-content">
          <h1>Hey, {profile.username} 👋</h1>
          <p>{streak > 0 ? `You're on a ${streak}-day streak. Keep it going!` : 'Ready to start a new streak today?'}</p>
        </div>
        <div className="welcome-streak">
          <span className="streak-icon">🔥</span>
          <span className="streak-num">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8efff', color: '#4f7cff' }}>⏱️</div>
          <div className="stat-body">
            <span className="stat-value">{Math.floor(studiedToday / 60)}h {studiedToday % 60}m</span>
            <span className="stat-label">Studied today</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f9ee', color: '#22c55e' }}>✅</div>
          <div className="stat-body">
            <span className="stat-value">{tasksDoneToday}/{todayTasks.length}</span>
            <span className="stat-label">Tasks done</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef4e6', color: '#f59e0b' }}>📚</div>
          <div className="stat-body">
            <span className="stat-value">{subjects.length}</span>
            <span className="stat-label">Subjects</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>⭐</div>
          <div className="stat-body">
            <span className="stat-value">Level {level}</span>
            <span className="stat-label">{currentLevelXp}/{nextLevelXp} XP</span>
          </div>
        </div>
      </div>

      <div className="dash-grid">
        <div className="card dash-tasks">
          <div className="card-head">
            <h3>Today's Tasks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button>
          </div>
          {todayTasks.length === 0 ? (
            <div className="dash-empty">No tasks due today. Enjoy your day! 🌿</div>
          ) : (
            <ul className="today-task-list">
              {todayTasks.map(t => (
                <li key={t.id} className="today-task-item">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)}>
                    {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`today-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                  {t.subject && <span className="task-subject-chip" style={{ background: t.subject.color + '22', color: t.subject.color }}>{t.subject.icon} {t.subject.name}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card dash-goal">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg className="goal-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - goalPct / 100)}
                transform="rotate(-90 60 60)" />
            </svg>
            <div className="goal-ring-text">
              <span className="goal-pct">{goalPct}%</span>
              <span className="goal-sub">{Math.floor(studiedToday / 60)}h {studiedToday % 60}m / {Math.floor(dailyGoal / 60)}h</span>
            </div>
          </div>
          <button className="btn btn-primary focus-shortcut" onClick={() => onNavigate('focus')}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" /></svg>
            Start Focus Session
          </button>
        </div>

        <div className="card dash-quicknotes">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="qn-input-row">
            <input className="qn-input" placeholder="Jot a quick note..." value={qnText}
              onChange={(e) => setQnText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote} disabled={qnBusy}>Add</button>
          </div>
          <ul className="qn-list">
            {quickNotes.length === 0 && <li className="dash-empty">No quick notes yet.</li>}
            {quickNotes.map(qn => (
              <li key={qn.id} className="qn-item">
                <span className="qn-text">{qn.content}</span>
                <button className="qn-delete" onClick={() => deleteQuickNote(qn.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card dash-xp">
          <div className="card-head"><h3>XP & Level</h3></div>
          <div className="xp-badge-row">
            <span className="xp-level-badge">Lv {level}</span>
            <div className="xp-bar-wrap">
              <div className="xp-bar" style={{ width: `${progress * 100}%` }} />
            </div>
            <span className="xp-text">{currentLevelXp}/{nextLevelXp}</span>
          </div>
          <p className="xp-hint">{nextLevelXp - currentLevelXp} XP to level {level + 1}</p>
        </div>

        <div className="card dash-weekly">
          <div className="card-head"><h3>This Week</h3></div>
          <div className="weekly-chart">
            {weeklyData.map((d, i) => (
              <div key={i} className="weekly-bar-col">
                <div className="weekly-bar-track">
                  <div className="weekly-bar" style={{ height: `${(d.mins / maxWeekly) * 100}%` }} title={`${d.mins} min`} />
                </div>
                <span className="weekly-bar-label">{d.label[0]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card dash-exams">
          <div className="card-head"><h3>Upcoming Exams</h3></div>
          {upcomingExams.length === 0 ? (
            <div className="dash-empty">No upcoming exams. 🎉</div>
          ) : (
            <ul className="exam-list">
              {upcomingExams.map(e => (
                <li key={e.id} className="exam-item">
                  <span className="exam-dot" style={{ background: e.subject?.color || '#999' }} />
                  <span className="exam-title">{e.title}</span>
                  <span className="exam-date">{formatDate(e.exam_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {quote && (
          <div className="card dash-quote">
            <div className="quote-mark">"</div>
            <p className="quote-text">{quote.text || quote.quote}</p>
            {quote.author && <span className="quote-author">— {quote.author}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
