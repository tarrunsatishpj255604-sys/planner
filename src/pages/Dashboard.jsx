import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, todayStr, formatDate, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, achievements, addXp, unlockAchievement, refresh } = useApp()
  const [quote, setQuote] = useState('')
  const [newNote, setNewNote] = useState('')

  useEffect(() => {
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (data && data.length > 0) setQuote(data[Math.floor(Math.random() * data.length)].quote)
    })
  }, [])

  if (!profile) return <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '40px auto' }} />

  const today = todayStr()
  const todaySessions = sessions.filter(s => s.session_date === today)
  const todayMinutes = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const todayTasks = tasks.filter(t => !t.completed && t.due_date === today)
  const completedToday = tasks.filter(t => t.completed && t.due_date === today).length
  const streak = getStreak(sessions)
  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp || 0)
  const goalPct = profile.daily_goal_minutes > 0 ? Math.min(100, (todayMinutes / profile.daily_goal_minutes) * 100) : 0
  const upcomingExams = exams.filter(e => new Date(e.exam_date) >= new Date(today)).slice(0, 3)

  const toggleTask = async (task) => {
    const completed = !task.completed
    await supabase.from('tasks').update({ completed }).eq('id', task.id)
    if (completed) { addXp(20); unlockAchievement('first_task') }
    refresh()
  }

  const addQuickNote = async () => {
    if (!newNote.trim()) return
    await supabase.from('quick_notes').insert({ content: newNote.trim() }).select().single()
    setNewNote(''); refresh()
  }

  const deleteQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id); refresh()
  }

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
  })
  const weekData = weekDays.map(day => ({
    day, minutes: sessions.filter(s => s.session_date === day).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  }))
  const maxWeek = Math.max(...weekData.map(d => d.minutes), 60)

  const unlockedCount = achievements.length
  const totalTasksDone = tasks.filter(t => t.completed).length

  return (
    <div className="dash-page">
      <div className="welcome-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="wb-content">
          <h2>Hey {profile.username || 'Student'}!</h2>
          <p>You're on a <strong>{streak}-day</strong> streak. Keep it going!</p>
        </div>
        <div className="wb-streak">
          <span className="streak-num">{streak}</span>
          <span className="streak-label">day streak</span>
        </div>
      </div>

      {quote && <div className="quote-bar"><span className="quote-mark">"</span>{quote}<span className="quote-mark">"</span></div>}

      <div className="grid-4">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div><div><div className="stat-val">{todayMinutes}m</div><div className="stat-label">Studied Today</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div><div><div className="stat-val">{completedToday}</div><div className="stat-label">Tasks Done Today</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</div><div><div className="stat-val">{subjects.length}</div><div className="stat-label">Subjects</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>⭐</div><div><div className="stat-val">Lvl {profile.level || 1}</div><div className="stat-label">Level</div></div></div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Today's Tasks</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button></div>
          {todayTasks.length === 0 ? <div className="dash-empty">No tasks due today. You're all caught up!</div> : (
            <div className="dash-tasks">
              {todayTasks.slice(0, 5).map(task => (
                <div key={task.id} className="dash-task" onClick={() => toggleTask(task)}>
                  <span className="task-check" style={task.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}} />
                  <span className="dash-task-title">{task.title}</span>
                  {task.subject && <span className="dash-task-sub" style={{ background: task.subject.color + '20', color: task.subject.color }}>{task.subject.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg className="goal-ring" width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--border)" strokeWidth="8" />
              <circle cx="60" cy="60" r="52" fill="none" stroke="var(--primary)" strokeWidth="8" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 52 * goalPct / 100} ${2 * Math.PI * 52}`} transform="rotate(-90 60 60)" />
            </svg>
            <div className="goal-ring-text"><span className="goal-pct">{Math.round(goalPct)}%</span><span className="goal-detail">{todayMinutes}/{profile.daily_goal_minutes}m</span></div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="qn-input-row">
            <input className="qn-input" value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Jot something down..." onKeyDown={e => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
          </div>
          <div className="qn-list">
            {quickNotes.length === 0 ? <div className="dash-empty">No quick notes yet.</div> : quickNotes.slice(0, 5).map(n => (
              <div key={n.id} className="qn-item"><span>{n.content}</span><button className="qn-del" onClick={() => deleteQuickNote(n.id)}>×</button></div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>XP & Level</h3></div>
          <div className="xp-info">
            <div className="xp-level-badge" style={{ background: 'var(--primary)' }}>Lvl {level}</div>
            <div className="xp-bar-wrap">
              <div className="xp-bar" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
            </div>
            <div className="xp-text">{currentLevelXp} / {nextLevelXp} XP</div>
          </div>
          <div className="xp-stats">
            <span>Total XP: {profile.xp || 0}</span>
            <span>Tasks Done: {totalTasksDone}</span>
            <span>Achievements: {unlockedCount}/{ACHIEVEMENT_DEFS.length}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="week-chart">
          {weekData.map((d, i) => (
            <div key={i} className="week-bar-wrap">
              <div className="week-bar" style={{ height: `${(d.minutes / maxWeek) * 100}%`, background: 'var(--primary)' }} />
              <span className="week-label">{['S','M','T','W','T','F','S'][new Date(d.day).getDay()]}</span>
              <span className="week-min">{d.minutes}m</span>
            </div>
          ))}
        </div>
      </div>

      {upcomingExams.length > 0 && (
        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button></div>
          <div className="exam-list">
            {upcomingExams.map(exam => (
              <div key={exam.id} className="exam-item">
                <span className="exam-date" style={{ background: (exam.subject?.color || 'var(--primary)') + '20', color: exam.subject?.color || 'var(--primary)' }}>{formatDate(exam.exam_date)}</span>
                <span className="exam-title">{exam.title}</span>
                {exam.subject && <span className="exam-sub">{exam.subject.name}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <button className="btn btn-primary focus-shortcut" onClick={() => onNavigate('focus')}>Start a Focus Session →</button>
    </div>
  )
}
