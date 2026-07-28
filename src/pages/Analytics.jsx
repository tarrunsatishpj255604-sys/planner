import { useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { getStreak } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects } = useApp()

  const streak = useMemo(() => getStreak(sessions), [sessions])
  const totalTime = useMemo(() => sessions.reduce((a, s) => a + (s.duration || 0), 0), [sessions])
  const tasksDone = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  const completionRate = tasks.length > 0 ? Math.round((tasksDone / tasks.length) * 100) : 0

  const weekData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((a, s) => a + (s.duration || 0), 0)
      days.push({ date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0), mins })
    }
    return days
  }, [sessions])

  const maxWeekMins = Math.max(...weekData.map(d => d.mins), 60)

  const heatmapData = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((a, s) => a + (s.duration || 0), 0)
      days.push({ date: ds, mins })
    }
    return days
  }, [sessions])

  const subjectData = useMemo(() => {
    return subjects.map(s => {
      const time = sessions.filter(sess => sess.subject_id === s.id).reduce((a, sess) => a + (sess.duration || 0), 0)
      return { ...s, time }
    }).filter(s => s.time > 0).sort((a, b) => b.time - a.time)
  }, [sessions, subjects])

  const maxSubjectTime = Math.max(...subjectData.map(s => s.time), 60)

  const heatLevel = (mins) => { if (mins === 0) return 0; if (mins < 30) return 1; if (mins < 60) return 2; if (mins < 120) return 3; return 4 }

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div>
          <h2>Analytics</h2>
          <p className="page-desc">Track your study progress with detailed insights and charts.</p>
        </div>
      </div>

      <div className="grid-4">
        <div className="card an-stat-card">
          <div className="an-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <span className="an-stat-val">{Math.round(totalTime / 60 * 10) / 10}h</span>
          <span className="an-stat-label">Total Time</span>
        </div>
        <div className="card an-stat-card">
          <div className="an-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>🔥</div>
          <span className="an-stat-val">{streak}</span>
          <span className="an-stat-label">Day Streak</span>
        </div>
        <div className="card an-stat-card">
          <div className="an-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <span className="an-stat-val">{tasksDone}</span>
          <span className="an-stat-label">Tasks Done</span>
        </div>
        <div className="card an-stat-card">
          <div className="an-stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>📊</div>
          <span className="an-stat-val">{completionRate}%</span>
          <span className="an-stat-label">Completion Rate</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="an-week-chart">
          {weekData.map((d, i) => (
            <div key={i} className="an-week-col">
              <div className="an-week-bar-track">
                <div className="an-week-bar-fill" style={{ height: `${(d.mins / maxWeekMins) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} />
              </div>
              <span className="an-week-label">{d.label}</span>
              <span className="an-week-val">{d.mins}m</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="an-heatmap">
          {heatmapData.map((d, i) => (
            <div key={i} className={`an-heat-cell level-${heatLevel(d.mins)}`} title={`${d.date}: ${d.mins}m`} />
          ))}
        </div>
        <div className="an-heat-legend">
          <span>Less</span>
          <div className="an-heat-cell level-0" /><div className="an-heat-cell level-1" /><div className="an-heat-cell level-2" /><div className="an-heat-cell level-3" /><div className="an-heat-cell level-4" />
          <span>More</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectData.length === 0 ? <p className="dash-empty">No study time logged yet.</p> : (
          <div className="an-subject-list">
            {subjectData.map(s => (
              <div key={s.id} className="an-subject-row">
                <span className="an-subject-name">{s.icon} {s.name}</span>
                <div className="an-subject-bar"><div className="an-subject-fill" style={{ width: `${(s.time / maxSubjectTime) * 100}%`, background: s.color }} /></div>
                <span className="an-subject-time">{Math.round(s.time)}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
