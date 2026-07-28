import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate } from '../lib/helpers.js'
import './CalendarPage.css'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Calendar() {
  const { tasks, exams, sessions, subjects } = useApp()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const prevMonth = () => { setCurrentDate(new Date(year, month - 1, 1)); setSelectedDate(null) }
  const nextMonth = () => { setCurrentDate(new Date(year, month + 1, 1)); setSelectedDate(null) }
  const goToday = () => { setCurrentDate(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]) }

  const dateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const getEventsForDate = (ds) => {
    const dayTasks = tasks.filter(t => t.due_date === ds && !t.archived)
    const dayExams = exams.filter(e => e.exam_date === ds)
    const daySessions = sessions.filter(s => s.session_date === ds)
    return { tasks: dayTasks, exams: dayExams, sessions: daySessions }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : null

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="calendar-page">
      <div className="cal-header">
        <div className="cal-nav">
          <button className="cal-arrow" onClick={prevMonth}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg></button>
          <h2>{MONTHS[month]} {year}</h2>
          <button className="cal-arrow" onClick={nextMonth}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg></button>
        </div>
        <button className="btn btn-outline btn-sm" onClick={goToday}>Today</button>
      </div>

      <div className="cal-grid">
        <div className="cal-weekdays">
          {DAYS.map(d => <span key={d} className="cal-wd">{d}</span>)}
        </div>
        <div className="cal-days">
          {cells.map((day, i) => {
            if (day === null) return <div key={i} className="cal-cell empty" />
            const ds = dateStr(day)
            const events = getEventsForDate(ds)
            const isToday = ds === todayStr
            const isSelected = ds === selectedDate
            const hasEvents = events.tasks.length > 0 || events.exams.length > 0 || events.sessions.length > 0
            return (
              <button
                key={i}
                className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(ds)}
              >
                <span className="cal-day-num">{day}</span>
                {hasEvents && (
                  <div className="cal-dots">
                    {events.exams.length > 0 && <span className="cal-dot exam" />}
                    {events.tasks.length > 0 && <span className="cal-dot task" />}
                    {events.sessions.length > 0 && <span className="cal-dot session" />}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {selectedDate && selectedEvents && (
        <div className="cal-detail">
          <h3>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          {selectedEvents.exams.length === 0 && selectedEvents.tasks.length === 0 && selectedEvents.sessions.length === 0 ? (
            <p className="dash-empty">Nothing scheduled for this day.</p>
          ) : (
            <div className="cal-event-list">
              {selectedEvents.exams.map(e => (
                <div key={e.id} className="cal-event exam-event">
                  <span className="cal-event-dot" style={{ background: e.subject?.color || 'var(--error)' }} />
                  <div><span className="cal-event-title">{e.title}</span><span className="cal-event-type">Exam</span></div>
                </div>
              ))}
              {selectedEvents.tasks.map(t => (
                <div key={t.id} className="cal-event">
                  <span className="cal-event-dot" style={{ background: t.subject?.color || 'var(--primary)' }} />
                  <div><span className="cal-event-title">{t.title}</span><span className="cal-event-type">Task {t.completed ? '(done)' : ''}</span></div>
                </div>
              ))}
              {selectedEvents.sessions.map(s => (
                <div key={s.id} className="cal-event">
                  <span className="cal-event-dot" style={{ background: s.subject?.color || 'var(--success)' }} />
                  <div><span className="cal-event-title">{s.duration_minutes}m study</span><span className="cal-event-type">Session</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="cal-legend">
        <span className="cal-leg-item"><span className="cal-dot exam" /> Exams</span>
        <span className="cal-leg-item"><span className="cal-dot task" /> Tasks due</span>
        <span className="cal-leg-item"><span className="cal-dot session" /> Study sessions</span>
      </div>
    </div>
  )
}
