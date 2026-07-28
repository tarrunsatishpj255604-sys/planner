import { useState, useEffect, useMemo, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './Dashboard.css'

export default function Dashboard({ onNavigate }) {
  const { profile, subjects, tasks, sessions, exams, quickNotes, loading, refresh, addXp, unlockAchievement } = useApp()
  const [newQuickNote, setNewQuickNote] = useState('')
  const [editingNote, setEditingNote] = useState(null)
  const [editText, setEditText] = useState('')
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    let active = true
    supabase
      .from('motivational_quotes')
      .select('quote, author')
      .order('random()')
      .limit(1)
      .single()
      .then(({ data }) => { if (active && data) setQuote(data) })
    return () => { active = false }
  }, [])

  const today = todayStr()
  const streak = useMemo(() => getStreak(sessions), [sessions])
  const todayTasks = useMemo(() => (tasks || []).filter(t => t.due_date === today && !t.archived), [tasks, today])
  const todayTasksDone = todayTasks.filter(t => t.completed).length
  const todaySessions = useMemo(() => (sessions || []).filter(s => s.session_date === today), [sessions, today])
  const minutesToday = todaySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const dailyGoal = profile?.daily_goal_minutes || 120
  const goalProgress = dailyGoal > 0 ? Math.min(minutesToday / dailyGoal, 1) : 0
  const xpInfo = levelFromXp(profile?.xp || 0)
  const upcomingExams = useMemo(() => (exams || []).filter(e => new Date(e.exam_date) >= new Date(today)).slice(0, 4), [exams, today])

  const weekDays = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = (sessions || []).filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }), mins })
    }
    return days
  }, [sessions])
  const maxWeekMins = Math.max(...weekDays.map(d => d.mins), 60)

  const toggleTask = useCallback(async (task) => {
    const newCompleted = !task.completed
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id)
    if (newCompleted) {
      const diff = task.difficulty || 'medium'
      const xp = XP_REWARDS.task_complete + (diff === 'hard' ? XP_REWARDS.task_hard : 0)
      await addXp(xp)
      const doneCount = (tasks || []).filter(t => t.completed).length + 1
      if (doneCount === 1) unlockAchievement('first_task')
      if (doneCount >= 10) unlockAchievement('tasks_10')
      if (doneCount >= 50) unlockAchievement('tasks_50')
    }
    refresh()
  }, [tasks, addXp, unlockAchievement, refresh])

  const addQuickNote = async () => {
    const text = newQuickNote.trim()
    if (!text) return
    const { data } = await supabase.from('quick_notes').insert({ content: text }).select().single()
    if (data) { setNewQuickNote(''); refresh() }
  }
  const deleteQuickNote = async (id) => { await supabase.from('quick_notes').delete().eq('id', id); refresh() }
  const saveEditNote = async (id) => {
    const text = editText.trim()
    if (!text) return
    await supabase.from('quick_notes').update({ content: text }).eq('id', id)
    setEditingNote(null); setEditText(''); refresh()
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const ringR = 52, ringC = 2 * Math.PI * ringR

  return (
    <div className="dashboard">
      <div className="welcome-banner" style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}>
        <div className="welcome-text">
          <h1>{greeting}, {profile?.username || 'Student'}! 👋</h1>
          <p>You're on a <strong>{streak}-day</strong> streak. Keep it going!</p>
        </div>
        <div className="welcome-streak">
          <span className="streak-flame">🔥</span>
          <span className="streak-num">{streak}</span>
        </div>
      </div>

      <div className="grid-4 dash-stats">
        <div className="card stat-card">
          <div className="stat-emoji">⏱️</div>
          <div className="stat-info"><span className="stat-value">{Math.floor(minutesToday / 60)}h {minutesToday % 60}m</span><span className="stat-label">Studied today</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-emoji">✅</div>
          <div className="stat-info"><span className="stat-value">{todayTasksDone}/{todayTasks.length}</span><span className="stat-label">Tasks done</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-emoji">📚</div>
          <div className="stat-info"><span className="stat-value">{subjects?.length || 0}</span><span className="stat-label">Subjects</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-emoji">⭐</div>
          <div className="stat-info"><span className="stat-value">Level {xpInfo.level}</span><span className="stat-label">{xpInfo.currentLevelXp}/{xpInfo.nextLevelXp} XP</span></div>
        </div>
      </div>

      <div className="grid-2 dash-main">
        <div className="card">
          <div className="card-head"><h3>Today's Tasks</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button></div>
          {todayTasks.length === 0 ? <div className="dash-empty">No tasks due today. Enjoy your day! 🎉</div> : (
            <div className="dash-tasks">
              {todayTasks.map(t => (
                <div key={t.id} className="dash-task">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`dash-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                  {t.subject && <span className="dash-task-subject" style={{ color: t.subject.color }}>{t.subject.icon}</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card goal-card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring-wrap">
            <svg width="140" height="140" viewBox="0 0 140 140" className="goal-ring">
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
              <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--primary)" strokeWidth="10" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - goalProgress)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
              <text x="70" y="66" textAnchor="middle" className="goal-ring-num">{Math.round(goalProgress * 100)}%</text>
              <text x="70" y="86" textAnchor="middle" className="goal-ring-label">{minutesToday}m / {dailyGoal}m</text>
            </svg>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="quick-note-input">
            <input type="text" placeholder="Jot something down..." value={newQuickNote} onChange={e => setNewQuickNote(e.target.value)} onKeyDown={e => e.key === 'Enter' && addQuickNote()} />
            <button className="btn btn-primary btn-sm" onClick={addQuickNote}>Add</button>
          </div>
          <div className="quick-notes-list">
            {(quickNotes || []).map(n => (
              <div key={n.id} className="quick-note-item">
                {editingNote === n.id ? (
                  <>
                    <input type="text" value={editText} onChange={e => setEditText(e.target.value)} autoFocus />
                    <button className="btn btn-primary btn-sm" onClick={() => saveEditNote(n.id)}>Save</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingNote(null)}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className="qn-content" onClick={() => { setEditingNote(n.id); setEditText(n.content) }}>{n.content}</span>
                    <button className="btn btn-ghost btn-sm qn-delete" onClick={() => deleteQuickNote(n.id)}>✕</button>
                  </>
                )}
              </div>
            ))}
            {(!quickNotes || quickNotes.length === 0) && <div className="dash-empty">No quick notes yet.</div>}
          </div>
        </div>

        <div className="card xp-card">
          <div className="card-head"><h3>XP & Level</h3><span className="level-badge" style={{ background: 'var(--primary)' }}>Lv {xpInfo.level}</span></div>
          <div className="xp-progress-wrap">
            <div className="xp-progress-bar"><div className="xp-progress-fill" style={{ width: `${xpInfo.progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
            <span className="xp-progress-text">{xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP</span>
          </div>
          <p className="xp-hint">{xpInfo.nextLevelXp - xpInfo.currentLevelXp} XP to level {xpInfo.level + 1}</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="week-chart">
          {weekDays.map((d, i) => (
            <div key={i} className="week-bar-col">
              <div className="week-bar-track">
                <div className="week-bar" style={{ height: `${(d.mins / maxWeekMins) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} title={`${d.mins}m`} />
              </div>
              <span className="week-bar-label">{d.label}</span>
              <span className="week-bar-mins">{d.mins}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Upcoming Exams</h3><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('calendar')}>Calendar</button></div>
          {upcomingExams.length === 0 ? <div className="dash-empty">No upcoming exams. 🎉</div> : (
            <div className="dash-exams">
              {upcomingExams.map(e => (
                <div key={e.id} className="dash-exam-item">
                  <span className="exam-dot" style={{ background: e.subject?.color || 'var(--primary)' }} />
                  <div className="exam-info"><span className="exam-title">{e.title}</span><span className="exam-date">{formatDate(e.exam_date)}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card quote-card" style={{ background: 'linear-gradient(135deg, var(--primary-l), var(--surface))' }}>
          <div className="card-head"><h3>💡 Daily Motivation</h3></div>
          {quote ? (
            <div className="quote-content"><p className="quote-text">"{quote.quote}"</p><span className="quote-author">— {quote.author}</span></div>
          ) : <div className="dash-empty">Loading inspiration...</div>}
        </div>
      </div>

      <button className="btn btn-primary focus-shortcut" onClick={() => onNavigate('focus')}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M5 3 2 6M22 6l-3-3" /></svg>
        Start a Focus Session
      </button>
    </div>
  )
}
