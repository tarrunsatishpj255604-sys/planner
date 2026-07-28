import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, loading, refresh, addXp, unlockAchievement } = useApp()
  const [newQuick, setNewQuick] = useState('')
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (mounted && data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
    return () => { mounted = false }
  }, [])

  if (loading || !profile) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const today = todayStr()
  const todaySessions = sessions.filter(s => s.session_date === today)
  const studiedToday = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const tasksCompletedToday = tasks.filter(t => t.completed && t.completed_at && t.completed_at.slice(0, 10) === today).length
  const todaysTasks = tasks.filter(t => !t.completed && t.due_date && t.due_date <= today).slice(0, 6)
  const streak = getStreak(sessions)
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp || 0)
  const dailyGoal = profile.daily_goal_minutes || 120
  const goalProgress = Math.min(studiedToday / dailyGoal, 1)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    return { date: ds, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) }
  })
  const maxMins = Math.max(...last7.map(d => d.mins), 60)

  const upcomingExams = exams.filter(e => e.exam_date >= today).slice(0, 4)

  const toggleTask = async (task) => {
    if (task.completed) {
      await supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', task.id)
    } else {
      await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', task.id)
      await addXp(XP_REWARDS.task_complete)
      await unlockAchievement('first_task')
    }
    refresh()
  }

  const addQuick = async () => {
    if (!newQuick.trim()) return
    await supabase.from('quick_notes').insert({ content: newQuick.trim() })
    setNewQuick('')
    refresh()
  }

  const delQuick = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    refresh()
  }

  const ringR = 52, ringC = 2 * Math.PI * ringR

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="wb-text">
          <h1>Welcome back, {profile.username || 'Student'}! 👋</h1>
          <p>You're on a <strong>{streak}-day</strong> streak. Keep it going!</p>
        </div>
        <div className="wb-streak">
          <span className="wb-flame">🔥</span>
          <span className="wb-num">{streak}</span>
        </div>
      </div>

      <div className="grid-4 stat-row">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-val">{studiedToday}<span>m</span></div>
          <div className="stat-label">Studied today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <div className="stat-val">{tasksCompletedToday}</div>
          <div className="stat-label">Tasks done today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</div>
          <div className="stat-val">{subjects.length}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>⭐</div>
          <div className="stat-val">{level}</div>
          <div className="stat-label">Level</div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="dash-col">
          <div className="card">
            <div className="card-head"><h3>Today's Tasks</h3>
              <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button>
            </div>
            {todaysTasks.length === 0 ? <div className="dash-empty">No pending tasks due. You're all caught up! 🎉</div> : (
              <div className="task-list">
                {todaysTasks.map(t => (
                  <div key={t.id} className="dash-task">
                    <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}} />
                    <div className="dash-task-info">
                      <span className={`dash-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                      {t.subject && <span className="dash-task-sub" style={{ color: t.subject.color }}>{t.subject.name}</span>}
                    </div>
                    <span className="dash-task-due">{formatDate(t.due_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <div className="card-head"><h3>This Week</h3></div>
            <div className="week-chart">
              {last7.map((d, i) => (
                <div key={i} className="week-bar-wrap">
                  <div className="week-bar-track">
                    <div className="week-bar" style={{ height: `${(d.mins / maxMins) * 100}%`, background: d.date === today ? 'var(--accent)' : 'var(--primary)' }} />
                  </div>
                  <span className="week-label">{d.label}</span>
                  <span className="week-mins">{d.mins}m</span>
                </div>
              ))}
            </div>
          </div>

          {upcomingExams.length > 0 && (
            <div className="card">
              <div className="card-head"><h3>Upcoming Exams</h3>
                <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button>
              </div>
              <div className="exam-list">
                {upcomingExams.map(e => (
                  <div key={e.id} className="exam-item">
                    <div className="exam-dot" style={{ background: e.subject?.color || 'var(--primary)' }} />
                    <div className="exam-info"><span className="exam-title">{e.title}</span>
                      {e.subject && <span className="exam-sub">{e.subject.name}</span>}</div>
                    <span className="exam-date">{formatDate(e.exam_date)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="dash-col">
          <div className="card goal-card">
            <div className="card-head"><h3>Daily Goal</h3></div>
            <div className="goal-ring-wrap">
              <svg width="140" height="140" viewBox="0 0 140 140" className="goal-ring">
                <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={ringC} strokeDashoffset={ringC * (1 - goalProgress)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              </svg>
              <div className="goal-ring-center">
                <span className="goal-pct">{Math.round(goalProgress * 100)}%</span>
                <span className="goal-detail">{studiedToday} / {dailyGoal}m</span>
              </div>
            </div>
          </div>

          <div className="card xp-card">
            <div className="card-head"><h3>Level {level}</h3><span className="xp-total">{profile.xp || 0} XP</span></div>
            <div className="xp-bar-track"><div className="xp-bar-fill" style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
            <div className="xp-detail">{currentLevelXp} / {nextLevelXp} XP to level {level + 1}</div>
          </div>

          <div className="card">
            <div className="card-head"><h3>Quick Notes</h3></div>
            <div className="quick-add">
              <input className="quick-input" placeholder="Jot something down..." value={newQuick} onChange={e => setNewQuick(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuick()} />
              <button className="btn btn-primary btn-sm" onClick={addQuick}>Add</button>
            </div>
            <div className="quick-list">
              {quickNotes.length === 0 ? <div className="dash-empty">No quick notes yet.</div> : quickNotes.slice(0, 6).map(q => (
                <div key={q.id} className="quick-item">
                  <span className="quick-content">{q.content}</span>
                  <button className="quick-del" onClick={() => delQuick(q.id)}>×</button>
                </div>
              ))}
            </div>
          </div>

          <button className="card focus-shortcut" onClick={() => onNavigate('focus')} style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
            <span className="fs-icon">🎯</span>
            <div className="fs-text"><span className="fs-title">Start a Focus Session</span><span className="fs-sub">Pomodoro, stopwatch & ambient sounds</span></div>
            <span className="fs-arrow">→</span>
          </button>

          {quote && (
            <div className="card quote-card">
              <div className="quote-mark">"</div>
              <p className="quote-text">{quote.text || quote.quote || quote.content}</p>
              {quote.author && <p className="quote-author">— {quote.author}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
