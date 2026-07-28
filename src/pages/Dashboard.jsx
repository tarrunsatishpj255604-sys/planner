import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS, SUBJECT_ICONS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, addXp, refresh } = useApp()
  const [quote, setQuote] = useState(null)
  const [qnText, setQnText] = useState('')
  const [qnEditing, setQnEditing] = useState(null)

  useEffect(() => {
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
  }, [])

  const today = todayStr()
  const levelInfo = levelFromXp(profile?.xp || 0)
  const streak = getStreak(sessions)

  const studiedToday = useMemo(() => {
    return sessions.filter(s => s.session_date === today).reduce((sum, s) => sum + (s.duration || 0), 0)
  }, [sessions, today])

  const tasksDoneToday = useMemo(() => tasks.filter(t => t.completed && t.completed_at?.startsWith(today)).length, [tasks, today])

  const todaysTasks = useMemo(() => tasks.filter(t => !t.completed && t.due_date === today).slice(0, 6), [tasks, today])

  const dailyGoal = profile?.daily_goal_minutes || 120
  const goalPct = Math.min(100, Math.round((studiedToday / dailyGoal) * 100))

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration || 0), 0)
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), mins })
    }
    return days
  }, [sessions])

  const upcomingExams = useMemo(() => exams.filter(e => e.exam_date >= today).slice(0, 3), [exams, today])

  const toggleTask = async (task) => {
    const completed = !task.completed
    await supabase.from('tasks').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', task.id)
    if (completed) {
      await addXp(XP_REWARDS.task_complete)
      const doneCount = tasks.filter(t => t.completed).length + 1
      if (doneCount === 1) { /* first task achievement handled elsewhere */ }
    }
    refresh()
  }

  const addQuickNote = async () => {
    if (!qnText.trim()) return
    if (qnEditing) {
      await supabase.from('quick_notes').update({ content: qnText }).eq('id', qnEditing.id)
      setQnEditing(null)
    } else {
      const { data: u } = await supabase.auth.getUser()
      await supabase.from('quick_notes').insert({ user_id: u.user.id, content: qnText })
    }
    setQnText('')
    refresh()
  }

  const deleteQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    refresh()
  }

  const editQuickNote = (n) => { setQnEditing(n); setQnText(n.content) }

  const ringR = 54, ringC = 2 * Math.PI * ringR

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome back, {profile?.username || 'Student'} 👋</h1>
          <p>{streak > 0 ? `🔥 ${streak}-day streak — keep it up!` : 'Ready to start a new streak today?'}</p>
        </div>
        <button className="btn btn-primary focus-shortcut" onClick={() => onNavigate?.('focus')}>
          🍅 Start Focus Session
        </button>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-value">{Math.floor(studiedToday / 60)}h {studiedToday % 60}m</div>
          <div className="stat-label">Studied Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <div className="stat-value">{tasksDoneToday}</div>
          <div className="stat-label">Tasks Done Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</div>
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⭐</div>
          <div className="stat-value">Level {levelInfo.level}</div>
          <div className="stat-label">{levelInfo.currentLevelXp}/{levelInfo.nextLevelXp} XP</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <h3>Today's Tasks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate?.('tasks')}>View all</button>
          </div>
          {todaysTasks.length === 0 ? (
            <div className="dash-empty">No tasks due today. Enjoy the breather! 🎉</div>
          ) : (
            <div className="dash-task-list">
              {todaysTasks.map(t => (
                <div key={t.id} className="dash-task">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)}>
                    {t.completed && '✓'}
                  </button>
                  <div className="dash-task-info">
                    <div className="dash-task-title">{t.title}</div>
                    {t.subject && <div className="dash-task-subject">{t.subject.icon} {t.subject.name}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card goal-card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg className="goal-ring" width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC - (ringC * goalPct / 100)}
                transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
              <text x="70" y="72" textAnchor="middle" dominantBaseline="middle" className="goal-ring-text">{goalPct}%</text>
            </svg>
            <div className="goal-meta">
              <div className="goal-meta-val">{Math.floor(studiedToday / 60)}h {studiedToday % 60}m</div>
              <div className="goal-meta-label">of {Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m goal</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="qn-input-row">
            <input className="qn-input" placeholder="Jot a quick note..." value={qnText}
              onChange={(e) => setQnText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>{qnEditing ? 'Save' : 'Add'}</button>
            {qnEditing && <button className="btn btn-ghost btn-sm" onClick={() => { setQnEditing(null); setQnText('') }}>Cancel</button>}
          </div>
          <div className="qn-list">
            {quickNotes.length === 0 ? <div className="dash-empty">No quick notes yet.</div> :
              quickNotes.map(n => (
                <div key={n.id} className="qn-item">
                  <span className="qn-content">{n.content}</span>
                  <div className="qn-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => editQuickNote(n)}>✏️</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => deleteQuickNote(n.id)}>🗑️</button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="card xp-card">
          <div className="card-head"><h3>Level Progress</h3></div>
          <div className="xp-level-row">
            <div className="xp-level-badge">Lv {levelInfo.level}</div>
            <div className="xp-level-info">
              <div className="xp-progress-track">
                <div className="xp-progress-fill" style={{ width: `${levelInfo.progress * 100}%` }} />
              </div>
              <div className="xp-progress-text">{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="week-chart">
          {weekDays.map(d => (
            <div key={d.date} className="week-bar-col">
              <div className="week-bar-wrap">
                <div className="week-bar" style={{ height: `${Math.max(2, (d.mins / Math.max(...weekDays.map(w => w.mins), 60)) * 100)}%` }} />
              </div>
              <div className="week-bar-label">{d.label}</div>
              <div className="week-bar-val">{d.mins}m</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3></div>
          {upcomingExams.length === 0 ? <div className="dash-empty">No upcoming exams.</div> : (
            <div className="exam-list">
              {upcomingExams.map(e => (
                <div key={e.id} className="exam-item">
                  <div className="exam-date">{formatDate(e.exam_date)}</div>
                  <div className="exam-info">
                    <div className="exam-title">{e.title}</div>
                    {e.subject && <div className="exam-subject">{e.subject.icon} {e.subject.name}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card quote-card">
          <div className="card-head"><h3>Daily Motivation</h3></div>
          {quote ? (
            <blockquote className="quote-text">"{quote.text || quote.quote}"</blockquote>
          ) : <div className="dash-empty">Stay focused and keep going 💪</div>}
        </div>
      </div>
    </div>
  )
}
