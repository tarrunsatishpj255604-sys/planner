import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { getStreak } from '../lib/helpers.js'
import './AnalyticsPage.css'

export default function Analytics() {
  const { sessions, tasks, subjects, loading } = useApp()

  const totalTime = useMemo(() => sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0), [sessions])
  const streak = getStreak(sessions)
  const completedTasks = useMemo(() => tasks.filter(t => t.completed).length, [tasks])
  const totalTasks = tasks.length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const weekData = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      days.push({ date: ds, mins, label: d.toLocaleDateString('en-US', { weekday: 'short' }) })
    }
    return days
  }, [sessions])
  const maxWeek = Math.max(...weekData.map(d => d.mins), 1)

  const heatmapData = useMemo(() => {
    const days = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const ds = d.toISOString().split('T')[0]
      const mins = sessions.filter(s => s.session_date === ds).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
      days.push({ date: ds, mins })
    }
    return days
  }, [sessions])
  const maxHeat = Math.max(...heatmapData.map(d => d.mins), 1)

  const subjectData = useMemo(() => {
    return subjects.map(s => ({
      ...s,
      time: sessions.filter(sess => sess.subject_id === s.id).reduce((sum, sess) => sum + (sess.duration_minutes || 0), 0),
    })).sort((a, b) => b.time - a.time)
  }, [subjects, sessions])
  const maxSubjectTime = Math.max(...subjectData.map(s => s.time), 1)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  const heatColor = (mins) => {
    if (mins === 0) return 'var(--surface-2)'
    const intensity = mins / maxHeat
    if (intensity > 0.75) return 'var(--primary)'
    if (intensity > 0.5) return 'rgba(79,124,255,0.7)'
    if (intensity > 0.25) return 'rgba(79,124,255,0.4)'
    return 'rgba(79,124,255,0.2)'
  }

  return (
    <div className="analytics-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Analytics</h2>
          <p className="page-desc">Track your study progress with detailed insights.</p>
        </div>
      </div>

      <div className="grid-4 analytics-stats">
        <div className="card analytics-stat"><span className="analytics-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</span><div><span className="analytics-stat-val">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span><span className="analytics-stat-label">total study time</span></div></div>
        <div className="card analytics-stat"><span className="analytics-stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>🔥</span><div><span className="analytics-stat-val">{streak}</span><span className="analytics-stat-label">day streak</span></div></div>
        <div className="card analytics-stat"><span className="analytics-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</span><div><span className="analytics-stat-val">{completedTasks}</span><span className="analytics-stat-label">tasks completed</span></div></div>
        <div className="card analytics-stat"><span className="analytics-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📊</span><div><span className="analytics-stat-val">{completionRate}%</span><span className="analytics-stat-label">completion rate</span></div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="analytics-week-chart">
          {weekData.map((d, i) => (
            <div key={i} className="analytics-week-bar-wrap">
              <span className="analytics-week-mins">{d.mins}m</span>
              <div className="analytics-week-bar" style={{ height: `${(d.mins / maxWeek) * 100}%`, background: d.mins > 0 ? 'var(--primary)' : 'var(--border)' }} />
              <span className="analytics-week-label">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>30-Day Activity Heatmap</h3></div>
        <div className="analytics-heatmap">
          {heatmapData.map((d, i) => (
            <div key={i} className="analytics-heat-cell" style={{ background: heatColor(d.mins) }} title={`${d.date}: ${d.mins}m`} />
          ))}
        </div>
        <div className="analytics-heat-legend">
          <span>Less</span>
          <div className="analytics-heat-cell" style={{ background: 'var(--surface-2)' }} />
          <div className="analytics-heat-cell" style={{ background: 'rgba(79,124,255,0.2)' }} />
          <div className="analytics-heat-cell" style={{ background: 'rgba(79,124,255,0.4)' }} />
          <div className="analytics-heat-cell" style={{ background: 'rgba(79,124,255,0.7)' }} />
          <div className="analytics-heat-cell" style={{ background: 'var(--primary)' }} />
          <span>More</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectData.length === 0 ? <div className="dash-empty">No subjects yet.</div> : (
          <div className="analytics-subject-bars">
            {subjectData.map(s => (
              <div key={s.id} className="analytics-subject-row">
                <span className="analytics-subject-name">{s.icon || '📘'} {s.name}</span>
                <div className="analytics-subject-bar-wrap">
                  <div className="analytics-subject-bar" style={{ width: `${(s.time / maxSubjectTime) * 100}%`, background: s.color }} />
                </div>
                <span className="analytics-subject-time">{Math.floor(s.time / 60)}h {s.time % 60}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
