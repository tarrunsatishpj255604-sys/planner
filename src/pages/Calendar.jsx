import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate } from '../lib/helpers.js'
import './CalendarPage.css'

export default function Calendar() {
  const { exams, tasks, sessions, loading } = useApp()
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selectedDay, setSelectedDay] = useState(null)

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
      const dayExams = exams.filter(e => e.exam_date === ds)
      const dayTasks = tasks.filter(t => t.due_date === ds)
      const daySessions = sessions.filter(s => s.session_date === ds)
      cells.push({ date: ds, day: d, exams: dayExams, tasks: dayTasks, sessions: daySessions })
    }
    return cells
  }, [year, month, exams, tasks, sessions])

  const today = new Date().toISOString().split('T')[0]
  const selectedEvents = selectedDay ? days.find(d => d && d.date === selectedDay) : null

  const prevMonth = () => setCursor(new Date(year, month - 1, 1))
  const nextMonth = () => setCursor(new Date(year, month + 1, 1))
  const goToday = () => { const d = new Date(); d.setDate(1); setCursor(d); setSelectedDay(today) }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Calendar</h2>
          <p className="page-desc">View your exams, tasks, and study sessions in one place.</p>
        </div>
        <div className="cal-nav">
          <button className="btn btn-outline btn-sm" onClick={prevMonth}>←</button>
          <span className="cal-month-label">{monthLabel}</span>
          <button className="btn btn-outline btn-sm" onClick={nextMonth}>→</button>
          <button className="btn btn-ghost btn-sm" onClick={goToday}>Today</button>
        </div>
      </div>

      <div className="card cal-card">
        <div className="cal-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d} className="cal-weekday">{d}</span>)}
        </div>
        <div className="cal-grid">
          {days.map((d, i) => {
            if (!d) return <div key={i} className="cal-cell empty" />
            const isToday = d.date === today
            const isSelected = d.date === selectedDay
            const hasEvents = d.exams.length > 0 || d.tasks.length > 0 || d.sessions.length > 0
            return (
              <button key={i} className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`} onClick={() => setSelectedDay(d.date)}>
                <span className="cal-day-num">{d.day}</span>
                <div className="cal-dots">
                  {d.exams.length > 0 && <span className="cal-dot exam" />}
                  {d.tasks.length > 0 && <span className="cal-dot task" />}
                  {d.sessions.length > 0 && <span className="cal-dot session" />}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="cal-legend">
        <span className="cal-legend-item"><span className="cal-dot exam" /> Exams</span>
        <span className="cal-legend-item"><span className="cal-dot task" /> Tasks</span>
        <span className="cal-legend-item"><span className="cal-dot session" /> Study Sessions</span>
      </div>

      {selectedEvents && (
        <div className="card cal-events">
          <div className="card-head"><h3>{formatDate(selectedEvents.date)}</h3></div>
          {selectedEvents.exams.length === 0 && selectedEvents.tasks.length === 0 && selectedEvents.sessions.length === 0 ? (
            <div className="dash-empty">No events on this day.</div>
          ) : (
            <div className="cal-event-list">
              {selectedEvents.exams.map(e => (
                <div key={e.id} className="cal-event-item"><span className="cal-dot exam" /><div><strong>{e.title}</strong><span>Exam · {e.subject?.name || 'No subject'}</span></div></div>
              ))}
              {selectedEvents.tasks.map(t => (
                <div key={t.id} className="cal-event-item"><span className="cal-dot task" /><div><strong>{t.title}</strong><span>Task · {t.subject?.name || 'No subject'} {t.completed ? '· ✓' : ''}</span></div></div>
              ))}
              {selectedEvents.sessions.map(s => (
                <div key={s.id} className="cal-event-item"><span className="cal-dot session" /><div><strong>{s.duration_minutes} min session</strong><span>{s.subject?.name || 'No subject'}{s.notes ? ` · ${s.notes}` : ''}</span></div></div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
