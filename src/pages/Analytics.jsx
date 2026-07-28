import { useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { getStreak, todayStr } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects, loading } = useApp()

  const totalMins = useMemo(() => (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0), [sessions])
  const streak = useMemo(() => getStreak(sessions), [sessions])
  const completedTasks = useMemo(() => (tasks || []).filter(t => t.completed).length, [tasks])
  const totalTasks = (tasks || []).filter(t => !t.archived).length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

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

  const heatmap = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = (sessions || []).filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      days.push({ date: ds, label: d.getDate(), mins })
    }
    return days
  }, [sessions])

  const subjectStats = useMemo(() => {
    return (subjects || []).map(s => {
      const mins = (sessions || []).filter(ss => ss.subject_id === s.id).reduce((sum, ss) => sum + (ss.duration_minutes || 0), 0)
      return { ...s, mins }
    }).sort((a, b) => b.mins - a.mins)
  }, [subjects, sessions])
  const maxSubjectMins = Math.max(...subjectStats.map(s => s.mins), 60)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="analytics-page">
      <div className="page-toolbar"><div><h2>Analytics</h2><p className="page-desc">Track your study progress and productivity.</p></div></div>

      <div className="grid-4">
        <div className="card stat-card"><div className="stat-emoji">⏱️</div><div className="stat-info"><span className="stat-value">{Math.floor(totalMins / 60)}h {totalMins % 60}m</span><span className="stat-label">Total Study Time</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">🔥</div><div className="stat-info"><span className="stat-value">{streak} days</span><span className="stat-label">Current Streak</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">✅</div><div className="stat-info"><span className="stat-value">{completedTasks}</span><span className="stat-label">Tasks Done</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">📊</div><div className="stat-info"><span className="stat-value">{completionRate}%</span><span className="stat-label">Completion Rate</span></div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="week-chart">
          {weekDays.map((d, i) => (
            <div key={i} className="week-bar-col">
              <div className="week-bar-track"><div className="week-bar" style={{ height: `${(d.mins / maxWeekMins) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} /></div>
              <span className="week-bar-label">{d.label}</span>
              <span className="week-bar-mins">{d.mins}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="heatmap">
          {heatmap.map((d, i) => {
            const intensity = d.mins === 0 ? 0 : Math.min(Math.ceil(d.mins / 30), 4)
            return <div key={i} className={`heat-cell heat-${intensity}`} title={`${d.date}: ${d.mins}m`} />
          })}
        </div>
        <div className="heatmap-legend"><span>Less</span><div className="heat-cell heat-0" /><div className="heat-cell heat-1" /><div className="heat-cell heat-2" /><div className="heat-cell heat-3" /><div className="heat-cell heat-4" /><span>More</span></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectStats.length === 0 ? <div className="dash-empty">No subjects yet.</div> : (
          <div className="subject-compare">
            {subjectStats.map(s => (
              <div key={s.id} className="sc-row">
                <span className="sc-label">{s.icon} {s.name}</span>
                <div className="sc-bar-track"><div className="sc-bar-fill" style={{ width: `${(s.mins / maxSubjectMins) * 100}%`, background: s.color }} /></div>
                <span className="sc-mins">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
