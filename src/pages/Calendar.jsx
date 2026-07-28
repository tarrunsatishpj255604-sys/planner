import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate, todayStr } from '../lib/helpers.js'
import './CalendarPage.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const { tasks, exams, sessions } = useApp()
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(todayStr())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      cells.push({
        date: ds,
        day: d,
        exams: exams.filter(e => e.exam_date === ds),
        tasks: tasks.filter(t => !t.archived && t.due_date === ds),
        sessions: sessions.filter(s => s.session_date === ds),
      })
    }
    return cells
  }, [year, month, exams, tasks, sessions])

  const selectedEvents = useMemo(() => {
    if (!selected) return null
    return {
      exams: exams.filter(e => e.exam_date === selected),
      tasks: tasks.filter(t => !t.archived && t.due_date === selected),
      sessions: sessions.filter(s => s.session_date === selected),
    }
  }, [selected, exams, tasks, sessions])

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); d.setDate(1); setCursor(d); setSelected(todayStr()) }

  const today = todayStr()

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div>
          <h2>Calendar</h2>
          <p className="page-desc">View your exams, tasks, and study sessions in one place.</p>
        </div>
        <div className="cal-nav">
          <button className="btn btn-outline btn-sm" onClick={prevMonth}>‹</button>
          <span className="cal-month-label">{monthLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={nextMonth}>›</button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
        </div>
      </div>

      <div className="cal-grid-wrap card">
        <div className="cal-weekdays">
          {WEEKDAYS.map(w => <div key={w} className="cal-weekday">{w}</div>)}
        </div>
        <div className="cal-grid">
          {days.map((d, i) => {
            if (!d) return <div key={i} className="cal-cell empty" />
            const isToday = d.date === today
            const isSelected = d.date === selected
            return (
              <button key={i} className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelected(d.date)}>
                <span className="cal-day-num">{d.day}</span>
                <div className="cal-dots">
                  {d.exams.length > 0 && <span className="cal-dot red" title={`${d.exams.length} exams`} />}
                  {d.tasks.length > 0 && <span className="cal-dot blue" title={`${d.tasks.length} tasks`} />}
                  {d.sessions.length > 0 && <span className="cal-dot green" title={`${d.sessions.length} sessions`} />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot red" /> Exams</span>
        <span className="cal-legend-item"><span className="cal-dot blue" /> Tasks</span>
        <span className="cal-legend-item"><span className="cal-dot green" /> Study sessions</span>
      </div>

      {selectedEvents && (
        <div className="card cal-events">
          <div className="card-head"><h3>{formatDate(selected)}</h3></div>
          {selectedEvents.exams.length === 0 && selectedEvents.tasks.length === 0 && selectedEvents.sessions.length === 0 ? (
            <p className="dash-empty">Nothing scheduled for this day.</p>
          ) : (
            <div className="cal-event-groups">
              {selectedEvents.exams.length > 0 && (
                <div className="cal-event-group">
                  <h4 className="cal-group-title red">Exams</h4>
                  {selectedEvents.exams.map(e => <div key={e.id} className="cal-event-item"><span className="cal-event-dot red" />{e.title}</div>)}
                </div>
              )}
              {selectedEvents.tasks.length > 0 && (
                <div className="cal-event-group">
                  <h4 className="cal-group-title blue">Tasks</h4>
                  {selectedEvents.tasks.map(t => <div key={t.id} className="cal-event-item"><span className="cal-event-dot blue" />{t.title}</div>)}
                </div>
              )}
              {selectedEvents.sessions.length > 0 && (
                <div className="cal-event-group">
                  <h4 className="cal-group-title green">Sessions</h4>
                  {selectedEvents.sessions.map(s => <div key={s.id} className="cal-event-item"><span className="cal-event-dot green" />{Math.floor((s.duration || 0) / 60)}h {(s.duration || 0) % 60}m</div>)}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
