import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, loading, refresh, addXp, unlockAchievement } = useApp()
  const [newQuick, setNewQuick] = useState('')
  const [quote, setQuote] = useState(null)
  const [todaySessions, setTodaySessions] = useState(0)

  useEffect(() => {
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
  }, [])

  useEffect(() => {
    const today = todayStr()
    setTodaySessions(sessions.filter(s => s.session_date === today).length)
  }, [sessions])

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const streak = getStreak(sessions)
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile?.xp || 0)
  const todayTasks = tasks.filter(t => t.due_date === todayStr() || (!t.due_date && !t.completed))
  const completedToday = todayTasks.filter(t => t.completed).length
  const dailyGoal = profile?.daily_goal || 120
  const todayMinutes = sessions.filter(s => s.session_date === todayStr()).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const goalPct = Math.min(todayMinutes / dailyGoal, 1)

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.completed).length
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    weekDays.push({ date: d, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1) })
  }
  const maxWeek = Math.max(...weekDays.map(w => w.mins), 60)

  const upcomingExams = exams.filter(e => new Date(e.exam_date) >= new Date(todayStr())).slice(0, 4)

  const toggleTask = async (task) => {
    const newCompleted = !task.completed
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id)
    if (newCompleted) {
      await addXp(XP_REWARDS.task_complete)
      await unlockAchievement('first_task')
    }
    refresh()
  }

  const addQuickNote = async () => {
    if (!newQuick.trim()) return
    await supabase.from('quick_notes').insert({ content: newQuick.trim() })
    setNewQuick('')
    refresh()
  }

  const deleteQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    refresh()
  }

  const ringR = 52
  const ringC = 2 * Math.PI * ringR

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="welcome-text">
          <h1>Welcome back, {profile?.username || 'Student'} 👋</h1>
          <p>{streak > 0 ? `🔥 ${streak}-day streak — keep it up!` : 'Start a new streak today by logging a focus session.'}</p>
        </div>
        <div className="welcome-streak">
          <div className="streak-num">{streak}</div>
          <div className="streak-label">Day Streak</div>
        </div>
      </div>

      <div className="grid-4 stat-row">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-info"><span className="stat-value">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span><span className="stat-label">Total Study</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>🔥</div>
          <div className="stat-info"><span className="stat-value">{streak}</span><span className="stat-label">Day Streak</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>✅</div>
          <div className="stat-info"><span className="stat-value">{completedTasks}/{totalTasks}</span><span className="stat-label">Tasks Done</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>📚</div>
          <div className="stat-info"><span className="stat-value">{subjects.length}</span><span className="stat-label">Subjects</span></div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Today's Tasks</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all →</button></div>
          {todayTasks.length === 0 ? <div className="dash-empty">No tasks due today. You're all caught up! 🎉</div> : (
            <div className="today-task-list">
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="today-task-item">
                  <button className={`task-check ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task)} style={task.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {task.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`today-task-title ${task.completed ? 'done' : ''}`}>{task.title}</span>
                  {task.subject && <span className="today-task-subject" style={{ background: task.subject.color + '22', color: task.subject.color }}>{task.subject.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card daily-goal-card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140" className="goal-ring">
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - goalPct)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              <text x="70" y="68" textAnchor="middle" className="ring-pct">{Math.round(goalPct * 100)}%</text>
              <text x="70" y="88" textAnchor="middle" className="ring-label">{todayMinutes}/{dailyGoal}m</text>
            </svg>
          </div>
          <p className="goal-status">{goalPct >= 1 ? '🎉 Goal reached!' : `${dailyGoal - todayMinutes}m to go`}</p>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="quick-note-input">
            <input type="text" placeholder="Jot a quick note..." value={newQuick} onChange={e => setNewQuick(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
          </div>
          <div className="quick-note-list">
            {quickNotes.length === 0 ? <div className="dash-empty">No quick notes yet.</div> : quickNotes.slice(0, 6).map(qn => (
              <div key={qn.id} className="quick-note-item">
                <span className="qn-content">{qn.content}</span>
                <button className="qn-delete" onClick={() => deleteQuickNote(qn.id)}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card xp-card">
          <div className="card-head"><h3>Level {level}</h3><span className="xp-total">{profile?.xp || 0} XP</span></div>
          <div className="xp-progress-wrap">
            <div className="xp-progress-bar">
              <div className="xp-progress-fill" style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>
            <div className="xp-progress-text">{currentLevelXp} / {nextLevelXp} XP</div>
          </div>
          <p className="xp-hint">{nextLevelXp - currentLevelXp} XP to level {level + 1}</p>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>This Week</h3></div>
          <div className="week-chart">
            {weekDays.map((w, i) => (
              <div key={i} className="week-bar-col">
                <div className="week-bar" style={{ height: `${(w.mins / maxWeek) * 100}%`, background: w.mins > 0 ? 'var(--primary)' : 'var(--surface-2)' }} />
                <span className="week-bar-label">{w.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar →</button></div>
          {upcomingExams.length === 0 ? <div className="dash-empty">No upcoming exams.</div> : (
            <div className="exam-list">
              {upcomingExams.map(exam => (
                <div key={exam.id} className="exam-item">
                  <div className="exam-date" style={{ background: (exam.subject?.color || 'var(--primary)') + '22', color: exam.subject?.color || 'var(--primary)' }}>
                    <span className="exam-day">{new Date(exam.exam_date).getDate()}</span>
                    <span className="exam-month">{new Date(exam.exam_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="exam-info"><span className="exam-title">{exam.title}</span><span className="exam-subject">{exam.subject?.name || 'General'}</span></div>
                  <span className="exam-when">{formatDate(exam.exam_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card quote-card">
          <div className="card-head"><h3>💡 Daily Motivation</h3></div>
          {quote ? <blockquote className="quote-text">"{quote.quote || quote.text || quote.content}"</blockquote> : <div className="dash-empty">Loading inspiration...</div>}
          {quote?.author && <cite className="quote-author">— {quote.author}</cite>}
        </div>

        <div className="card focus-shortcut" style={{ background: 'linear-gradient(135deg, var(--accent), var(--primary))' }}>
          <div className="focus-shortcut-content">
            <h3>Ready to focus?</h3>
            <p>Start a focus session and earn XP. You've logged {todaySessions} session{todaySessions !== 1 ? 's' : ''} today.</p>
            <button className="btn btn-sm focus-go-btn" onClick={() => onNavigate('focus')}>Start Session →</button>
          </div>
          <div className="focus-shortcut-icon">🧘</div>
        </div>
      </div>
    </div>
  )
}
