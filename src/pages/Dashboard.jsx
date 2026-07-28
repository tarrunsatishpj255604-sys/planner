import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, loading, refresh, addXp, unlockAchievement } = useApp()
  const [qnInput, setQnInput] = useState('')
  const [quote, setQuote] = useState(null)
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    let mounted = true
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (mounted && data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
    return () => { mounted = false }
  }, [])

  const today = todayStr()
  const streak = getStreak(sessions)
  const studiedToday = useMemo(() => sessions.filter(s => s.session_date === today).reduce((sum, s) => sum + (s.duration_minutes || 0), 0), [sessions, today])
  const tasksCompletedToday = useMemo(() => tasks.filter(t => t.completed && t.completed_at && t.completed_at.startsWith(today)).length, [tasks, today])
  const todaysTasks = useMemo(() => tasks.filter(t => !t.completed && t.due_date && t.due_date <= today).slice(0, 6), [tasks, today])
  const upcomingExams = useMemo(() => exams.filter(e => e.exam_date >= today).slice(0, 4), [exams, today])
  const dailyGoal = profile?.daily_goal_minutes || 120
  const goalPct = Math.min(studiedToday / dailyGoal, 1)
  const xpInfo = profile ? levelFromXp(profile.xp || 0) : { level: 1, currentLevelXp: 0, nextLevelXp: 100, progress: 0 }

  const weekData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      days.push({ date: ds, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [sessions])
  const maxWeek = Math.max(...weekData.map(d => d.mins), 1)

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

  const addQuickNote = async () => {
    if (!qnInput.trim()) return
    await supabase.from('quick_notes').insert({ content: qnInput.trim() })
    setQnInput('')
    refresh()
  }
  const delQuickNote = async (id) => {
    setSavingId(id)
    await supabase.from('quick_notes').delete().eq('id', id)
    setSavingId(null)
    refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  const R = 52, C = 2 * Math.PI * R
  return (
    <div className="dashboard">
      <div className="dash-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="dash-banner-content">
          <h2>Welcome back, {profile?.username || 'Student'} 👋</h2>
          <p>Day {streak} streak · {studiedToday} min studied today</p>
        </div>
        <div className="dash-banner-streak">
          <span className="streak-flame">🔥</span>
          <span className="streak-num">{streak}</span>
        </div>
      </div>

      <div className="grid-4 dash-stats">
        <div className="card dash-stat"><span className="dash-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</span><div><span className="dash-stat-val">{studiedToday}</span><span className="dash-stat-label">min today</span></div></div>
        <div className="card dash-stat"><span className="dash-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</span><div><span className="dash-stat-val">{tasksCompletedToday}</span><span className="dash-stat-label">tasks done</span></div></div>
        <div className="card dash-stat"><span className="dash-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</span><div><span className="dash-stat-val">{subjects.length}</span><span className="dash-stat-label">subjects</span></div></div>
        <div className="card dash-stat"><span className="dash-stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>⭐</span><div><span className="dash-stat-val">{xpInfo.level}</span><span className="dash-stat-label">level</span></div></div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Today's Tasks</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button></div>
          {todaysTasks.length === 0 ? <div className="dash-empty">No tasks due today. You're all caught up! 🎉</div> : (
            <div className="dash-tasks">
              {todaysTasks.map(t => (
                <div key={t.id} className="dash-task-item">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                  <div className="dash-task-info">
                    <span className={t.completed ? 'dash-task-title done' : 'dash-task-title'}>{t.title}</span>
                    {t.subject && <span className="dash-task-subject" style={{ color: t.subject.color }}>{t.subject.name}</span>}
                  </div>
                  <span className="dash-task-due">{formatDate(t.due_date)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="dash-goal-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
              <circle cx="70" cy="70" r={R} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - goalPct)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            </svg>
            <div className="dash-goal-center">
              <span className="dash-goal-pct">{Math.round(goalPct * 100)}%</span>
              <span className="dash-goal-detail">{studiedToday}/{dailyGoal}m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="dash-qn-input">
            <input type="text" placeholder="Jot something down..." value={qnInput} onChange={e => setQnInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
          </div>
          <div className="dash-qn-list">
            {quickNotes.length === 0 ? <div className="dash-empty">No quick notes yet.</div> : quickNotes.slice(0, 6).map(qn => (
              <div key={qn.id} className="dash-qn-item">
                <span className="dash-qn-content">{qn.content}</span>
                <button className="dash-qn-del" onClick={() => delQuickNote(qn.id)} disabled={savingId === qn.id}>✕</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>XP & Level</h3></div>
          <div className="dash-xp">
            <div className="dash-xp-level">
              <span className="dash-xp-badge" style={{ background: 'var(--primary)' }}>{xpInfo.level}</span>
              <span className="dash-xp-text">Level {xpInfo.level}</span>
            </div>
            <div className="dash-xp-bar">
              <div className="dash-xp-fill" style={{ width: `${xpInfo.progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
            </div>
            <span className="dash-xp-detail">{xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP</span>
          </div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>This Week</h3></div>
          <div className="dash-week-chart">
            {weekData.map((d, i) => (
              <div key={i} className="dash-week-bar-wrap">
                <div className="dash-week-bar" style={{ height: `${(d.mins / maxWeek) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} />
                <span className="dash-week-label">{d.label}</span>
                <span className="dash-week-mins">{d.mins}m</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button></div>
          {upcomingExams.length === 0 ? <div className="dash-empty">No upcoming exams.</div> : (
            <div className="dash-exams">
              {upcomingExams.map(e => (
                <div key={e.id} className="dash-exam-item">
                  <span className="dash-exam-dot" style={{ background: e.subject?.color || 'var(--primary)' }} />
                  <div><span className="dash-exam-title">{e.title}</span><span className="dash-exam-date">{formatDate(e.exam_date)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card dash-quote-card">
          <div className="card-head"><h3>💡 Daily Motivation</h3></div>
          {quote ? <p className="dash-quote">"{quote.text || quote.quote}"</p> : <div className="dash-empty">Loading quote...</div>}
        </div>

        <div className="card dash-focus-shortcut">
          <div className="card-head"><h3>Focus Session</h3></div>
          <p className="dash-focus-desc">Start a Pomodoro or stopwatch session to track your study time and earn XP.</p>
          <button className="btn btn-primary" onClick={() => onNavigate('focus')}>Start Focus Session →</button>
        </div>
      </div>
    </div>
  )
}
