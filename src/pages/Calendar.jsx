import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate } from '../lib/helpers.js'
import './CalendarPage.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const { tasks, exams, sessions, loading } = useApp()
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [selectedDay, setSelectedDay] = useState(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const cells = []
    for (let i = 0; i < firstDay; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toISOString().split('T')[0]
      cells.push({ day: d, dateStr, events: { exams: (exams || []).filter(e => e.exam_date === dateStr), tasks: (tasks || []).filter(t => t.due_date === dateStr && !t.archived), sessions: (sessions || []).filter(s => s.session_date === dateStr) } })
    }
    return cells
  }, [year, month, tasks, exams, sessions])

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); setCursor(new Date(d.getFullYear(), d.getMonth(), 1)); setSelectedDay(null) }

  const selectedEvents = selectedDay ? days.find(d => d && d.dateStr === selectedDay) : null

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div><h2>Calendar</h2><p className="page-desc">View your tasks, exams, and study sessions.</p></div>
        <div className="cal-nav">
          <button className="btn btn-outline btn-sm" onClick={prevMonth}>←</button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
          <button className="btn btn-outline btn-sm" onClick={nextMonth}>→</button>
        </div>
      </div>

      <div className="card">
        <h3 className="cal-month">{cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h3>
        <div className="cal-grid">
          {WEEKDAYS.map(wd => <div key={wd} className="cal-weekday">{wd}</div>)}
          {days.map((d, i) => (
            <div key={i} className={`cal-day ${d ? '' : 'empty'} ${d?.dateStr === todayStr ? 'today' : ''} ${d?.dateStr === selectedDay ? 'selected' : ''}`} onClick={() => d && setSelectedDay(d.dateStr)}>
              {d && (
                <>
                  <span className="cal-day-num">{d.day}</span>
                  <div className="cal-dots">
                    {d.events.exams.length > 0 && <span className="cal-dot dot-exam" title={`${d.events.exams.length} exams`} />}
                    {d.events.tasks.length > 0 && <span className="cal-dot dot-task" title={`${d.events.tasks.length} tasks`} />}
                    {d.events.sessions.length > 0 && <span className="cal-dot dot-session" title={`${d.events.sessions.length} sessions`} />}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot dot-exam" /> Exams</span>
        <span className="cal-legend-item"><span className="cal-dot dot-task" /> Tasks</span>
        <span className="cal-legend-item"><span className="cal-dot dot-session" /> Study Sessions</span>
      </div>

      {selectedEvents && (
        <div className="card cal-day-detail">
          <div className="card-head"><h3>{new Date(selectedEvents.dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3></div>
          {selectedEvents.events.exams.length === 0 && selectedEvents.events.tasks.length === 0 && selectedEvents.events.sessions.length === 0 ? (
            <div className="dash-empty">No events on this day.</div>
          ) : (
            <div className="cal-events">
              {selectedEvents.events.exams.map(e => <div key={e.id} className="cal-event"><span className="cal-event-dot" style={{ background: '#ef4444' }} /><div><span className="cal-event-title">{e.title}</span><span className="cal-event-type">Exam {e.subject && `· ${e.subject.name}`}</span></div></div>)}
              {selectedEvents.events.tasks.map(t => <div key={t.id} className="cal-event"><span className="cal-event-dot" style={{ background: '#4f7cff' }} /><div><span className="cal-event-title">{t.title}</span><span className="cal-event-type">Task {t.subject && `· ${t.subject.name}`}</span></div></div>)}
              {selectedEvents.events.sessions.map(s => <div key={s.id} className="cal-event"><span className="cal-event-dot" style={{ background: '#22c55e' }} /><div><span className="cal-event-title">{s.duration_minutes}m session</span><span className="cal-event-type">Study {s.subject && `· ${s.subject.name}`}</span></div></div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
