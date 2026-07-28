import { useApp } from '../lib/AppContext.jsx'
import { getStreak, todayStr } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, subjects, tasks } = useApp()

  const totalMin = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const streak = getSteark(sessions)
  const completedTasks = tasks.filter(t => t.completed).length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  // Weekly data (last 7 days)
  const weekDays = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + s.duration_minutes, 0)
    weekDays.push({ label: d.toLocaleDateString('en-US', { weekday: 'short' }), mins })
  }

  // Monthly data (last 30 days heatmap)
  const heatmap = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + s.duration_minutes, 0)
    heatmap.push({ date: ds, mins, day: d.getDate() })
  }

  // Subject comparison
  const subjectStats = subjects.map(s => {
    const mins = sessions.filter(sess => sess.subject_id === s.id).reduce((sum, sess) => sum + sess.duration_minutes, 0)
    const subTasks = tasks.filter(t => t.subject_id === s.id)
    const completed = subTasks.filter(t => t.completed).length
    return { ...s, mins, taskCount: subTasks.length, completed, pct: subTasks.length > 0 ? Math.round((completed / subTasks.length) * 100) : 0 }
  }).sort((a, b) => b.mins - a.mins)

  const maxWeekMin = Math.max(...weekDays.map(d => d.mins), 1)
  const maxSubMin = Math.max(...subjectStats.map(s => s.mins), 1)
  const heatLevels = [0, 1, 30, 60, 120]
  const getHeatColor = (mins) => {
    if (mins === 0) return 'var(--surface-2)'
    if (mins < 30) return 'rgba(79,124,255,0.25)'
    if (mins < 60) return 'rgba(79,124,255,0.5)'
    if (mins < 120) return 'rgba(79,124,255,0.75)'
    return 'var(--primary)'
  }

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <p className="page-desc">Track your study habits with detailed charts and statistics.</p>
      </div>

      <div className="grid-4">
        <div className="card stat-mini">
          <span className="ana-big-num">{Math.floor(totalMin / 60)}h {totalMin % 60}m</span>
          <span className="ana-label">Total study time</span>
        </div>
        <div className="card stat-mini">
          <span className="ana-big-num">{streak}</span>
          <span className="ana-label">Day streak</span>
        </div>
        <div className="card stat-mini">
          <span className="ana-big-num">{completedTasks}</span>
          <span className="ana-label">Tasks completed</span>
        </div>
        <div className="card stat-mini">
          <span className="ana-big-num">{completionRate}%</span>
          <span className="ana-label">Completion rate</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Weekly Study Time</h3></div>
        <div className="ana-bar-chart">
          {weekDays.map((d, i) => (
            <div key={i} className="ana-bar-col">
              <div className="ana-bar-track">
                <div className="ana-bar-fill" style={{ height: `${(d.mins / maxWeekMin) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--surface-2)' }} />
              </div>
              <span className="ana-bar-label">{d.label[0]}</span>
              <span className="ana-bar-val">{d.mins > 0 ? `${d.mins}m` : ''}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Study Heatmap (last 30 days)</h3></div>
        <div className="ana-heatmap">
          {heatmap.map((h, i) => (
            <div key={i} className="ana-heat-cell" style={{ background: getHeatColor(h.mins) }} title={`${h.date}: ${h.mins}m`} />
          ))}
        </div>
        <div className="ana-heat-legend">
          <span>Less</span>
          {heatLevels.map((l, i) => <div key={i} className="ana-heat-cell" style={{ background: getHeatColor(l) }} />)}
          <span>More</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectStats.length === 0 ? (
          <p className="dash-empty">Add subjects to see comparison.</p>
        ) : (
          <div className="ana-subject-list">
            {subjectStats.map(s => (
              <div key={s.id} className="ana-subject-row">
                <span className="ana-subject-name">
                  <span className="ana-dot" style={{ background: s.color }} />
                  {s.icon} {s.name}
                </span>
                <div className="ana-subject-bar">
                  <div className="ana-subject-fill" style={{ width: `${(s.mins / maxSubMin) * 100}%`, background: s.color }} />
                </div>
                <span className="ana-subject-time">{Math.floor(s.mins / 60)}h {s.mins % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function getSteark(sessions) { return getStreak(sessions) }
