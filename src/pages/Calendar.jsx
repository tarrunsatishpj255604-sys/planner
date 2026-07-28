import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { todayStr } from '../lib/helpers.js'
import './CalendarPage.css'

export default function Calendar() {
  const { tasks, exams, sessions } = useApp()
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthName = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr = []
    for (let i = 0; i < firstDay; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)
    return arr
  }, [year, month])

  const dateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const eventsForDay = (ds) => ({
    exams: exams.filter(e => e.exam_date === ds),
    tasks: tasks.filter(t => t.due_date === ds && !t.archived),
    sessions: sessions.filter(s => s.session_date === ds),
  })

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); d.setDate(1); setCursor(d); setSelected(todayStr()) }

  const today = todayStr()
  const selectedEvents = selected ? eventsForDay(selected) : null

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div><h2>Calendar</h2><p className="page-desc">See your exams, tasks, and study sessions at a glance.</p></div>
      </div>

      <div className="cal-nav">
        <button className="btn btn-outline btn-sm" onClick={prevMonth}>← Prev</button>
        <h3 className="cal-month">{monthName}</h3>
        <button className="btn btn-outline btn-sm" onClick={nextMonth}>Next →</button>
        <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
      </div>

      <div className="cal-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="cal-dow">{d}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />
          const ds = dateStr(d)
          const ev = eventsForDay(ds)
          const hasExams = ev.exams.length > 0
          const hasTasks = ev.tasks.length > 0
          const hasSessions = ev.sessions.length > 0
          return (
            <button key={i} className={`cal-cell ${ds === today ? 'today' : ''} ${selected === ds ? 'selected' : ''}`} onClick={() => setSelected(ds)}>
              <span className="cal-day-num">{d}</span>
              <div className="cal-dots">
                {hasExams && <span className="cal-dot red" />}
                {hasTasks && <span className="cal-dot blue" />}
                {hasSessions && <span className="cal-dot green" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot red" /> Exams</span>
        <span className="cal-legend-item"><span className="cal-dot blue" /> Tasks</span>
        <span className="cal-legend-item"><span className="cal-dot green" /> Sessions</span>
      </div>

      {selected && (
        <div className="card cal-events">
          <div className="card-head"><h3>{selected}</h3></div>
          {!selectedEvents || (selectedEvents.exams.length === 0 && selectedEvents.tasks.length === 0 && selectedEvents.sessions.length === 0) ? (
            <div className="dash-empty">No events on this day.</div>
          ) : (
            <div className="cal-event-list">
              {selectedEvents.exams.map(e => (
                <div key={e.id} className="cal-event red"><span className="cal-event-icon">📋</span> {e.title}</div>
              ))}
              {selectedEvents.tasks.map(t => (
                <div key={t.id} className="cal-event blue"><span className="cal-event-icon">✅</span> {t.title}</div>
              ))}
              {selectedEvents.sessions.map(s => (
                <div key={s.id} className="cal-event green"><span className="cal-event-icon">⏱️</span> {s.duration}m session</div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
