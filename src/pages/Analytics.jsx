import { useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { getStreak } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, subjects, tasks } = useApp()

  const totalMins = useMemo(() => sessions.reduce((sum, s) => sum + (s.duration || 0), 0), [sessions])
  const streak = getStreak(sessions)
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = tasks.length ? Math.round((completedTasks / tasks.length) * 100) : 0

  const weekly = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration || 0), 0)
      days.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' })[0], mins })
    }
    return days
  }, [sessions])
  const maxWeekly = Math.max(60, ...weekly.map(d => d.mins))

  const heatmap = useMemo(() => {
    const cells = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration || 0), 0)
      cells.push({ date: ds, mins, day: d.getDate() })
    }
    return cells
  }, [sessions])

  const subjectBars = useMemo(() => {
    return subjects.map(s => {
      const mins = sessions.filter(se => se.subject_id === s.id).reduce((sum, se) => sum + (se.duration || 0), 0)
      return { ...s, mins }
    }).sort((a, b) => b.mins - a.mins)
  }, [subjects, sessions])
  const maxSubjMins = Math.max(60, ...subjectBars.map(s => s.mins))

  const heatLevel = (mins) => {
    if (mins === 0) return 0
    if (mins < 30) return 1
    if (mins < 60) return 2
    if (mins < 120) return 3
    return 4
  }

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div>
          <h2>Analytics</h2>
          <p className="page-desc">Track your study habits and progress over time.</p>
        </div>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8efff', color: '#4f7cff' }}>⏱️</div>
          <div className="stat-body"><span className="stat-value">{Math.floor(totalMins / 60)}h {totalMins % 60}m</span><span className="stat-label">Total time</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>🔥</div>
          <div className="stat-body"><span className="stat-value">{streak} days</span><span className="stat-label">Current streak</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f9ee', color: '#22c55e' }}>✅</div>
          <div className="stat-body"><span className="stat-value">{completedTasks}</span><span className="stat-label">Tasks completed</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef4e6', color: '#f59e0b' }}>📊</div>
          <div className="stat-body"><span className="stat-value">{completionRate}%</span><span className="stat-label">Completion rate</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 7 Days</h3></div>
        <div className="an-weekly-chart">
          {weekly.map((d, i) => (
            <div key={i} className="an-bar-col">
              <div className="an-bar-track">
                <div className="an-bar" style={{ height: `${(d.mins / maxWeekly) * 100}%` }} title={`${d.mins} min`} />
              </div>
              <span className="an-bar-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>30-Day Activity</h3></div>
        <div className="an-heatmap">
          {heatmap.map((c, i) => (
            <div key={i} className={`an-heat-cell level-${heatLevel(c.mins)}`} title={`${c.date}: ${c.mins} min`} />
          ))}
        </div>
        <div className="an-heat-legend">
          <span>Less</span>
          <div className="an-heat-cell level-0" />
          <div className="an-heat-cell level-1" />
          <div className="an-heat-cell level-2" />
          <div className="an-heat-cell level-3" />
          <div className="an-heat-cell level-4" />
          <span>More</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectBars.length === 0 ? (
          <p className="dash-empty">No subjects yet.</p>
        ) : (
          <div className="an-subj-list">
            {subjectBars.map(s => (
              <div key={s.id} className="an-subj-row">
                <span className="an-subj-name">{s.icon} {s.name}</span>
                <div className="an-subj-bar-track">
                  <div className="an-subj-bar" style={{ width: `${(s.mins / maxSubjMins) * 100}%`, background: s.color }} />
                </div>
                <span className="an-subj-mins">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
