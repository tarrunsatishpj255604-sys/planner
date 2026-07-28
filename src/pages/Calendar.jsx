import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate } from '../lib/helpers.js'
import './CalendarPage.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function Calendar() {
  const { tasks, exams, sessions } = useApp()
  const [cursor, setCursor] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const eventsByDate = useMemo(() => {
    const map = {}
    exams.forEach(e => { const d = e.exam_date; if (!map[d]) map[d] = []; map[d].push({ type: 'exam', label: e.title, color: e.subject?.color || '#ef4444' }) })
    tasks.forEach(t => { if (t.due_date && !t.archived) { const d = t.due_date; if (!map[d]) map[d] = []; map[d].push({ type: 'task', label: t.title, color: t.subject?.color || '#4f7cff' }) } })
    sessions.forEach(s => { const d = s.session_date; if (!map[d]) map[d] = []; map[d].push({ type: 'session', label: `${s.duration}m session`, color: s.subject?.color || '#22c55e' }) })
    return map
  }, [tasks, exams, sessions])

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const todayStr = new Date().toISOString().split('T')[0]
  const dateStr = (d) => { const dd = String(d).padStart(2, '0'); const mm = String(month + 1).padStart(2, '0'); return `${year}-${mm}-${dd}` }

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { setCursor(new Date()); setSelectedDay(todayStr) }

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : []

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div>
          <h2>Calendar</h2>
          <p className="page-desc">View your exams, tasks, and study sessions in one place.</p>
        </div>
      </div>

      <div className="cal-nav">
        <button className="btn btn-ghost btn-sm" onClick={prevMonth}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
        <h3 className="cal-month">{MONTHS[month]} {year}</h3>
        <button className="btn btn-ghost btn-sm" onClick={nextMonth}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
        <button className="btn btn-outline btn-sm cal-today" onClick={goToday}>Today</button>
      </div>

      <div className="cal-grid">
        {DOW.map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div key={i} className="cal-cell empty" />
          const ds = dateStr(d)
          const events = eventsByDate[ds] || []
          const isToday = ds === todayStr
          const isSelected = ds === selectedDay
          return (
            <div key={i} className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDay(ds)}>
              <span className="cal-day-num">{d}</span>
              <div className="cal-dots">
                {events.slice(0, 3).map((e, j) => <span key={j} className="cal-dot" style={{ background: e.color }} />)}
                {events.length > 3 && <span className="cal-dot-more">+{events.length - 3}</span>}
              </div>
            </div>
          )
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-leg-item"><span className="cal-leg-dot" style={{ background: '#ef4444' }} /> Exams</span>
        <span className="cal-leg-item"><span className="cal-leg-dot" style={{ background: '#4f7cff' }} /> Tasks</span>
        <span className="cal-leg-item"><span className="cal-leg-dot" style={{ background: '#22c55e' }} /> Sessions</span>
      </div>

      {selectedDay && (
        <div className="card cal-day-events">
          <div className="card-head"><h3>{formatDate(selectedDay)}</h3></div>
          {selectedEvents.length === 0 ? <p className="dash-empty">No events on this day.</p> : (
            <div className="cal-event-list">
              {selectedEvents.map((e, i) => (
                <div key={i} className="cal-event">
                  <span className="cal-event-dot" style={{ background: e.color }} />
                  <span className="cal-event-label">{e.label}</span>
                  <span className="cal-event-type">{e.type}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
