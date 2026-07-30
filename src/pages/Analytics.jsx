import { useApp } from '../lib/AppContext.jsx'
import { getStreak, todayStr } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects, loading } = useApp()

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalHours = (totalMinutes / 60).toFixed(1)
  const streak = getStreak(sessions)
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    weekDays.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 1), mins })
  }
  const maxWeek = Math.max(...weekDays.map(w => w.mins), 60)

  const heatmapData = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    heatmapData.push({ date: ds, mins, day: d.getDate() })
  }
  const maxHeat = Math.max(...heatmapData.map(h => h.mins), 1)
  const getHeatColor = (mins) => {
    if (mins === 0) return 'var(--surface-2)'
    const pct = mins / maxHeat
    if (pct < 0.25) return 'rgba(79,124,255,0.25)'
    if (pct < 0.5) return 'rgba(79,124,255,0.5)'
    if (pct < 0.75) return 'rgba(79,124,255,0.75)'
    return 'var(--primary)'
  }

  const subjectStats = subjects.map(subj => {
    const mins = sessions.filter(s => s.subject_id === subj.id).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    const subTasks = tasks.filter(t => t.subject_id === subj.id)
    const done = subTasks.filter(t => t.completed).length
    return { name: subj.name, color: subj.color, icon: subj.icon, mins, taskPct: subTasks.length ? done / subTasks.length : 0 }
  }).sort((a, b) => b.mins - a.mins)
  const maxSubjMins = Math.max(...subjectStats.map(s => s.mins), 1)

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div><h2>Analytics</h2><p className="page-desc">Track your study progress, streaks, and productivity over time.</p></div>
      </div>

      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-info"><span className="stat-value">{totalHours}h</span><span className="stat-label">Total Study Time</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>🔥</div>
          <div className="stat-info"><span className="stat-value">{streak}</span><span className="stat-label">Day Streak</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>✅</div>
          <div className="stat-info"><span className="stat-value">{completedTasks}</span><span className="stat-label">Tasks Completed</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>📊</div>
          <div className="stat-info"><span className="stat-value">{completionRate}%</span><span className="stat-label">Completion Rate</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3><span className="analytics-sub">Minutes per day</span></div>
        <div className="week-chart">
          {weekDays.map((w, i) => (
            <div key={i} className="week-bar-col">
              <span className="week-bar-value">{w.mins}m</span>
              <div className="week-bar" style={{ height: `${(w.mins / maxWeek) * 100}%`, background: w.mins > 0 ? 'var(--primary)' : 'var(--surface-2)' }} />
              <span className="week-bar-label">{w.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>30-Day Activity</h3><span className="analytics-sub">Study heatmap</span></div>
        <div className="heatmap">
          {heatmapData.map((h, i) => (
            <div key={i} className="heat-cell" style={{ background: getHeatColor(h.mins) }} title={`${h.date}: ${h.mins}m`}>
              <span className="heat-day">{h.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3><span className="analytics-sub">Time spent per subject</span></div>
        {subjectStats.length === 0 ? <div className="dash-empty">No subjects to compare.</div> : (
          <div className="subject-comparison">
            {subjectStats.map((s, i) => (
              <div key={i} className="sc-item">
                <div className="sc-header"><span className="sc-name">{s.icon} {s.name}</span><span className="sc-time">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span></div>
                <div className="sc-bar-track"><div className="sc-bar-fill" style={{ width: `${(s.mins / maxSubjMins) * 100}%`, background: s.color }} /></div>
                <div className="sc-task-pct">{Math.round(s.taskPct * 100)}% tasks done</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
