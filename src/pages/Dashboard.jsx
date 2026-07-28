import { useState, useEffect, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS, DIFFICULTY_CONFIG } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { user, profile, subjects, tasks, sessions, exams, quickNotes, addXp, loading } = useApp()
  const [quote, setQuote] = useState(null)
  const [qnText, setQnText] = useState('')
  const [qnEditing, setQnEditing] = useState(null)
  const [qnEdit, setQnEdit] = useState('')

  const today = todayStr()
  const streak = useMemo(() => getStreak(sessions), [sessions])
  const { level, currentLevelXp, nextLevelXp, progress } = useMemo(() => levelFromXp(profile?.xp || 0), [profile?.xp])

  const todayTasks = useMemo(() => tasks.filter(t => t.due_date === today || (!t.due_date && !t.completed)), [tasks, today])
  const tasksDoneToday = useMemo(() => tasks.filter(t => t.completed && t.completed_at && t.completed_at.startsWith(today)).length, [tasks, today])
  const studiedToday = useMemo(() => sessions.filter(s => s.session_date === today).reduce((a, s) => a + (s.duration || 0), 0), [sessions, today])
  const upcomingExams = useMemo(() => exams.filter(e => new Date(e.exam_date) >= new Date(today)).slice(0, 3), [exams, today])

  const dailyGoal = profile?.daily_goal || 120
  const goalProgress = Math.min(studiedToday / dailyGoal, 1)

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((a, s) => a + (s.duration || 0), 0)
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0), mins })
    }
    return days
  }, [sessions])

  useEffect(() => {
    supabase.from('motivational_quotes').select('*').then(({ data }) => {
      if (data && data.length) setQuote(data[Math.floor(Math.random() * data.length)])
    })
  }, [])

  const toggleTask = async (task) => {
    const newCompleted = !task.completed
    const updates = { completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    if (newCompleted) {
      const diff = DIFFICULTY_CONFIG[task.difficulty]?.xp || XP_REWARDS.task_complete
      await addXp(diff)
    }
    window.location.reload()
  }

  const addQuickNote = async () => {
    if (!qnText.trim()) return
    await supabase.from('quick_notes').insert({ user_id: user.id, content: qnText.trim() })
    setQnText('')
    window.location.reload()
  }

  const deleteQuickNote = async (id) => {
    await supabase.from('quick_notes').delete().eq('id', id)
    window.location.reload()
  }

  const startEditQn = (n) => { setQnEditing(n.id); setQnEdit(n.content) }
  const saveEditQn = async () => {
    if (!qnEdit.trim()) return
    await supabase.from('quick_notes').update({ content: qnEdit.trim() }).eq('id', qnEditing)
    setQnEditing(null); setQnEdit('')
    window.location.reload()
  }

  const ringR = 52, ringC = 2 * Math.PI * ringR

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}>
        <div className="wb-text">
          <h1>Hey, {profile?.username || 'Student'}! 👋</h1>
          <p>{streak > 0 ? `🔥 ${streak}-day streak — keep it up!` : 'Ready to start studying?'}</p>
        </div>
        <div className="wb-level">
          <span className="wb-lvl-num">{level}</span>
          <span className="wb-lvl-label">Level</span>
        </div>
      </div>

      <div className="grid-4 dash-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-val">{Math.round(studiedToday)}m</div>
          <div className="stat-label">Studied Today</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <div className="stat-val">{tasksDoneToday}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</div>
          <div className="stat-val">{subjects.length}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>⭐</div>
          <div className="stat-val">{level}</div>
          <div className="stat-label">Level</div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Today's Tasks</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button></div>
          {todayTasks.length === 0 ? <p className="dash-empty">No tasks for today. Enjoy the break! 🎉</p> : (
            <div className="dash-tasks">
              {todayTasks.slice(0, 5).map(t => (
                <div key={t.id} className="dash-task">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`dash-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                  {t.subject && <span className="dash-task-sub" style={{ background: t.subject.color + '20', color: t.subject.color }}>{t.subject.name}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg className="goal-ring" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
              <circle cx="60" cy="60" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round"
                strokeDasharray={ringC} strokeDashoffset={ringC * (1 - goalProgress)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
            </svg>
            <div className="goal-ring-text">
              <span className="goal-pct">{Math.round(goalProgress * 100)}%</span>
              <span className="goal-detail">{Math.round(studiedToday)}m / {dailyGoal}m</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="qn-input-row">
            <input className="qn-input" placeholder="Jot something down..." value={qnText} onChange={e => setQnText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
          </div>
          <div className="qn-list">
            {quickNotes.length === 0 ? <p className="dash-empty">No quick notes yet.</p> : quickNotes.slice(0, 6).map(n => (
              <div key={n.id} className="qn-item">
                {qnEditing === n.id ? (
                  <>
                    <input className="qn-edit" value={qnEdit} onChange={e => setQnEdit(e.target.value)} autoFocus />
                    <button className="btn btn-sm btn-primary" onClick={saveEditQn}>Save</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setQnEditing(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="qn-content">{n.content}</span>
                    <button className="btn btn-sm btn-ghost" onClick={() => startEditQn(n)}>✏️</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => deleteQuickNote(n.id)}>🗑️</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Level Progress</h3></div>
          <div className="xp-card-body">
            <div className="xp-level-row">
              <span className="xp-big-level" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>Lvl {level}</span>
              <div className="xp-bar-info">
                <span className="xp-current">{currentLevelXp} / {nextLevelXp} XP</span>
                <span className="xp-to-next">{Math.round(nextLevelXp - currentLevelXp)} XP to next level</span>
              </div>
            </div>
            <div className="xp-bar"><div className="xp-bar-fill" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} /></div>
          </div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>This Week</h3></div>
          <div className="week-chart">
            {weekDays.map((d, i) => (
              <div key={i} className="week-bar-col">
                <div className="week-bar-track">
                  <div className="week-bar-fill" style={{ height: `${Math.min(d.mins / 120, 1) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} />
                </div>
                <span className="week-bar-label">{d.label}</span>
                <span className="week-bar-val">{d.mins}m</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button></div>
          {upcomingExams.length === 0 ? <p className="dash-empty">No upcoming exams. 🎉</p> : (
            <div className="dash-exams">
              {upcomingExams.map(e => (
                <div key={e.id} className="dash-exam">
                  <div className="dash-exam-date" style={{ background: (e.subject?.color || 'var(--primary)') + '20', color: e.subject?.color || 'var(--primary)' }}>
                    <span className="de-day">{new Date(e.exam_date).getDate()}</span>
                    <span className="de-mon">{new Date(e.exam_date).toLocaleDateString('en-US', { month: 'short' })}</span>
                  </div>
                  <div className="dash-exam-info">
                    <span className="de-title">{e.title}</span>
                    <span className="de-sub">{e.subject?.name || 'General'} · {formatDate(e.exam_date)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card quote-card" style={{ background: 'var(--primary-l)', borderColor: 'transparent' }}>
          <div className="quote-icon">💬</div>
          {quote ? (
            <>
              <p className="quote-text">"{quote.quote || quote.text || ''}"</p>
              <span className="quote-author">— {quote.author || 'Unknown'}</span>
            </>
          ) : <p className="quote-text">Loading inspiration...</p>}
        </div>

        <div className="card focus-shortcut">
          <div className="card-head"><h3>Focus Session</h3></div>
          <p className="fs-desc">Start a focus session to earn XP and build your streak.</p>
          <button className="btn btn-primary fs-btn" onClick={() => onNavigate('focus')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
            Start Focus Session
          </button>
        </div>
      </div>
    </div>
  )
}
