import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate, todayStr } from '../lib/helpers.js'
import './CalendarPage.css'

export default function Calendar() {
  const { exams, tasks, sessions, loading } = useApp()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selected, setSelected] = useState(todayStr())

  if (loading) return <div className="cal-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const year = cursor.getFullYear(), month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = todayStr()
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const dateStr = (d) => d ? d.toISOString().split('T')[0] : ''
  const eventsFor = (ds) => {
    if (!ds) return []
    const e = exams.filter(x => x.exam_date === ds).map(x => ({ type: 'exam', label: x.title, color: x.subject?.color || '#ef4444' }))
    const t = tasks.filter(x => x.due_date === ds).map(x => ({ type: 'task', label: x.title, color: x.subject?.color || '#4f7cff' }))
    const s = sessions.filter(x => x.session_date === ds).map(x => ({ type: 'session', label: `${x.duration_minutes}m`, color: x.subject?.color || '#22c55e' }))
    return [...e, ...t, ...s]
  }

  const selectedEvents = eventsFor(selected)

  const prev = () => setCursor(new Date(year, month - 1, 1))
  const next = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelected(today) }

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Calendar</h2><p className="page-desc">Your study schedule at a glance.</p></div>
        <div className="cal-nav">
          <button className="btn btn-outline btn-sm" onClick={prev}>←</button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
          <button className="btn btn-outline btn-sm" onClick={next}>→</button>
        </div>
      </div>

      <div className="grid-2 cal-layout">
        <div className="card cal-card">
          <div className="cal-month-head"><h3>{monthName}</h3></div>
          <div className="cal-grid">
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-dow">{d}</div>)}
            {cells.map((d, i) => {
              const ds = dateStr(d)
              const evts = eventsFor(ds)
              const isToday = ds === today
              const isSel = ds === selected
              return (
                <div key={i} className={`cal-cell ${!d ? 'empty' : ''} ${isToday ? 'today' : ''} ${isSel ? 'selected' : ''}`} onClick={() => d && setSelected(ds)}>
                  {d && <span className="cal-day-num">{d.getDate()}</span>}
                  {evts.length > 0 && <div className="cal-dots">{evts.slice(0, 3).map((e, j) => <span key={j} className="cal-dot" style={{ background: e.color }} />)}</div>}
                </div>
              )
            })}
          </div>
          <div className="cal-legend">
            <span className="cal-leg"><span className="cal-dot" style={{ background: '#ef4444' }} /> Exams</span>
            <span className="cal-leg"><span className="cal-dot" style={{ background: '#4f7cff' }} /> Tasks</span>
            <span className="cal-leg"><span className="cal-dot" style={{ background: '#22c55e' }} /> Sessions</span>
          </div>
        </div>

        <div className="card cal-events">
          <div className="card-head"><h3>{selected ? new Date(selected + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a day'}</h3></div>
          {selectedEvents.length === 0 ? <div className="dash-empty">No events on this day.</div> : (
            <div className="cal-event-list">
              {selectedEvents.map((e, i) => (
                <div key={i} className="cal-event-item">
                  <span className="cal-event-dot" style={{ background: e.color }} />
                  <span className="cal-event-type">{e.type}</span>
                  <span className="cal-event-label">{e.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
