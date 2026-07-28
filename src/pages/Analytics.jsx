import { useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { getStreak, todayStr } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects } = useApp()

  const totalMins = useMemo(() => sessions.reduce((sum, s) => sum + (s.duration || 0), 0), [sessions])
  const streak = useMemo(() => getStreak(sessions), [sessions])
  const tasksDone = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  const completionRate = useMemo(() => tasks.length ? Math.round((tasksDone / tasks.length) * 100) : 0, [tasks, tasksDone])

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

  const maxWeekMins = Math.max(...weekDays.map(d => d.mins), 60)

  const heatmap = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration || 0), 0)
      days.push({ date: ds, mins, day: d.getDate() })
    }
    return days
  }, [sessions])

  const subjectStats = useMemo(() => {
    return subjects.map(s => {
      const mins = sessions.filter(ss => ss.subject_id === s.id).reduce((sum, ss) => sum + (ss.duration || 0), 0)
      const subTasks = tasks.filter(t => t.subject_id === s.id)
      const done = subTasks.filter(t => t.completed).length
      return { ...s, mins, tasksDone: done, totalTasks: subTasks.length }
    }).sort((a, b) => b.mins - a.mins)
  }, [subjects, sessions, tasks])

  const maxSubjectMins = Math.max(...subjectStats.map(s => s.mins), 1)

  const heatColor = (mins) => {
    if (mins === 0) return 'var(--surface-2)'
    if (mins < 30) return 'var(--primary-l)'
    if (mins < 60) return '#a8c2ff'
    if (mins < 120) return '#4f7cff'
    return 'var(--primary-d)'
  }

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div><h2>Analytics</h2><p className="page-desc">Track your study progress and productivity trends.</p></div>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-value">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div>
          <div className="stat-label">Total Study Time</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>🔥</div>
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <div className="stat-value">{tasksDone}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>📊</div>
          <div className="stat-value">{completionRate}%</div>
          <div className="stat-label">Completion Rate</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="week-chart">
          {weekDays.map(d => (
            <div key={d.date} className="week-bar-col">
              <div className="week-bar-wrap">
                <div className="week-bar" style={{ height: `${Math.max(2, (d.mins / maxWeekMins) * 100)}%` }} />
              </div>
              <div className="week-bar-label">{d.label}</div>
              <div className="week-bar-val">{d.mins}m</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="heatmap-grid">
          {heatmap.map(d => (
            <div key={d.date} className="heatmap-cell" style={{ background: heatColor(d.mins) }} title={`${d.date}: ${d.mins}m`}>
              <span className="heatmap-day">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="heatmap-legend">
          <span>Less</span>
          <span className="heatmap-cell-sm" style={{ background: 'var(--surface-2)' }} />
          <span className="heatmap-cell-sm" style={{ background: 'var(--primary-l)' }} />
          <span className="heatmap-cell-sm" style={{ background: '#a8c2ff' }} />
          <span className="heatmap-cell-sm" style={{ background: '#4f7cff' }} />
          <span className="heatmap-cell-sm" style={{ background: 'var(--primary-d)' }} />
          <span>More</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectStats.length === 0 ? <div className="dash-empty">No subjects to compare.</div> : (
          <div className="subject-compare">
            {subjectStats.map(s => (
              <div key={s.id} className="subject-compare-row">
                <div className="sc-label">{s.icon} {s.name}</div>
                <div className="sc-bar-track">
                  <div className="sc-bar-fill" style={{ width: `${(s.mins / maxSubjectMins) * 100}%`, background: s.color }} />
                </div>
                <div className="sc-value">{Math.floor(s.mins / 60)}h {s.mins % 60}m</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
