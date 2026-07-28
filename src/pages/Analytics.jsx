import { useApp } from '../lib/AppContext.jsx'
import { getStreak } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects, loading } = useApp()

  if (loading) return <div className="an-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const totalMins = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const streak = getStreak(sessions)
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  // last 7 days
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i))
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    return { date: ds, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) }
  })
  const maxMins = Math.max(...last7.map(d => d.mins), 60)

  // 30 day heatmap
  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (29 - i))
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
    return { date: ds, mins }
  })
  const max30 = Math.max(...last30.map(d => d.mins), 1)

  // subject comparison
  const subjTimes = subjects.map(s => ({
    name: s.name, color: s.color || '#4f7cff',
    mins: sessions.filter(se => se.subject_id === s.id).reduce((sum, se) => sum + (se.duration_minutes || 0), 0),
  })).sort((a, b) => b.mins - a.mins)
  const maxSubj = Math.max(...subjTimes.map(s => s.mins), 60)

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Analytics</h2><p className="page-desc">Track your study progress over time.</p></div>
      </div>

      <div className="grid-4 an-stats">
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div><div className="an-stat-val">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div><div className="an-stat-label">Total study time</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>🔥</div><div className="an-stat-val">{streak}</div><div className="an-stat-label">Day streak</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div><div className="an-stat-val">{completedTasks}</div><div className="an-stat-label">Tasks completed</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📊</div><div className="an-stat-val">{completionRate}%</div><div className="an-stat-label">Completion rate</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="an-week-chart">
          {last7.map((d, i) => (
            <div key={i} className="an-week-bar-wrap">
              <div className="an-week-bar-track"><div className="an-week-bar" style={{ height: `${(d.mins / maxMins) * 100}%`, background: 'var(--primary)' }} /></div>
              <span className="an-week-label">{d.label}</span><span className="an-week-mins">{d.mins}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="an-heatmap">
          {last30.map((d, i) => {
            const intensity = d.mins / max30
            const opacity = d.mins === 0 ? 0.08 : 0.2 + intensity * 0.8
            return <div key={i} className="an-heat-cell" style={{ background: `rgba(79,124,255,${opacity})` }} title={`${d.date}: ${d.mins}m`} />
          })}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjTimes.length === 0 ? <div className="dash-empty">No subjects yet.</div> : (
          <div className="an-subj-list">
            {subjTimes.map((s, i) => (
              <div key={i} className="an-subj-row">
                <span className="an-subj-name">{s.name}</span>
                <div className="an-subj-bar-track"><div className="an-subj-bar-fill" style={{ width: `${(s.mins / maxSubj) * 100}%`, background: s.color }} /></div>
                <span className="an-subj-time">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
