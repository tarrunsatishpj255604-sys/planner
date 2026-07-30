import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate, todayStr } from '../lib/helpers.js'
import './CalendarPage.css'

export default function Calendar() {
  const { tasks, sessions, exams, loading } = useApp()
  const [cursor, setCursor] = useState(new Date())
  const [selected, setSelected] = useState(null)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startWeekday = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  const today = todayStr()

  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const getEvents = (day) => {
    if (!day) return []
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return [
      ...exams.filter(e => e.exam_date === ds).map(e => ({ type: 'exam', label: e.title, color: '#ef4444' })),
      ...tasks.filter(t => t.due_date === ds).map(t => ({ type: 'task', label: t.title, color: '#4f7cff' })),
      ...sessions.filter(s => s.session_date === ds).map(s => ({ type: 'session', label: `${s.duration_minutes}m session`, color: '#22c55e' })),
    ]
  }

  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))

  const selectedEvents = selected ? getEvents(selected) : []

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div><h2>Calendar</h2><p className="page-desc">View your exams, tasks, and study sessions in one place.</p></div>
      </div>

      <div className="grid-2 calendar-layout">
        <div className="card cal-card">
          <div className="cal-nav">
            <button className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button>
            <h3>{monthName}</h3>
            <button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button>
          </div>
          <div className="cal-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="cal-wd">{d}</span>)}
          </div>
          <div className="cal-grid">
            {cells.map((day, i) => {
              if (!day) return <div key={i} className="cal-cell empty" />
              const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const events = getEvents(day)
              const isToday = ds === today
              const isSelected = selected === day
              return (
                <button key={i} className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelected(day)}>
                  <span className="cal-day-num">{day}</span>
                  {events.length > 0 && (
                    <div className="cal-dots">
                      {events.slice(0, 3).map((e, j) => <span key={j} className="cal-dot" style={{ background: e.color }} />)}
                      {events.length > 3 && <span className="cal-dot-more">+{events.length - 3}</span>}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>{selected ? `${monthName.split(' ')[0]} ${selected}` : 'Legend & Events'}</h3></div>
          <div className="cal-legend">
            <div className="legend-item"><span className="legend-dot" style={{ background: '#ef4444' }} /> Exams</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#4f7cff' }} /> Tasks</div>
            <div className="legend-item"><span className="legend-dot" style={{ background: '#22c55e' }} /> Sessions</div>
          </div>
          <div className="cal-events">
            {!selected ? (
              <div className="dash-empty">Click a day to see events.</div>
            ) : selectedEvents.length === 0 ? (
              <div className="dash-empty">No events on this day.</div>
            ) : (
              selectedEvents.map((e, i) => (
                <div key={i} className="cal-event-item">
                  <span className="cal-event-dot" style={{ background: e.color }} />
                  <span className="cal-event-label">{e.label}</span>
                  <span className="cal-event-type">{e.type}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
