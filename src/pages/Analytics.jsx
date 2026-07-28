import { useApp } from '../lib/AppContext.jsx'
import { getStreak } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects } = useApp()
  const totalTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const streak = getStreak(sessions)
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const weekDays = [...Array(7)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return d.toISOString().split('T')[0]
  })
  const weekData = weekDays.map(day => ({ day, minutes: sessions.filter(s => s.session_date === day).reduce((sum, s) => sum + (s.duration_minutes || 0), 0) }))
  const maxWeek = Math.max(...weekData.map(d => d.minutes), 60)

  const heatDays = [...Array(30)].map((_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i)); return d.toISOString().split('T')[0]
  })
  const heatData = heatDays.map(day => ({ day, minutes: sessions.filter(s => s.session_date === day).reduce((sum, s) => sum + (s.duration_minutes || 0), 0) }))
  const maxHeat = Math.max(...heatData.map(d => d.minutes), 1)

  const subjectTimes = subjects.map(sub => ({ name: sub.name, color: sub.color, minutes: sessions.filter(s => s.subject_id === sub.id).reduce((sum, s) => sum + (s.duration_minutes || 0), 0) })).sort((a, b) => b.minutes - a.minutes)
  const maxSubTime = Math.max(...subjectTimes.map(s => s.minutes), 1)

  return (
    <div className="analytics-page">
      <div className="page-toolbar"><div><h2>Analytics</h2><p className="page-desc">Track your study progress and habits</p></div></div>

      <div className="grid-4">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div><div><div className="stat-val">{Math.floor(totalTime / 60)}h {totalTime % 60}m</div><div className="stat-label">Total Study Time</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>🔥</div><div><div className="stat-val">{streak}</div><div className="stat-label">Day Streak</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div><div><div className="stat-val">{completedTasks}</div><div className="stat-label">Tasks Completed</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>📊</div><div><div className="stat-val">{completionRate}%</div><div className="stat-label">Completion Rate</div></div></div>
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

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="heatmap">
          {heatData.map((d, i) => {
            const intensity = d.minutes / maxHeat
            return <div key={i} className="heat-cell" style={{ background: intensity > 0 ? `rgba(79,124,255,${0.15 + intensity * 0.85})` : 'var(--surface-2)' }} title={`${d.day}: ${d.minutes}m`} />
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectTimes.length === 0 ? <div className="dash-empty">No study data yet.</div> : (
          <div className="subject-bars">
            {subjectTimes.map((s, i) => (
              <div key={i} className="subject-bar-row">
                <span className="sb-name">{s.name}</span>
                <div className="sb-bar-wrap"><div className="sb-bar" style={{ width: `${(s.minutes / maxSubTime) * 100}%`, background: s.color }} /></div>
                <span className="sb-time">{Math.floor(s.minutes / 60)}h {s.minutes % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
