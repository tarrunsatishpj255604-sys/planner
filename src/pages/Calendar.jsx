import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { formatDate, todayStr } from '../lib/helpers.js'
import './CalendarPage.css'

export default function Calendar() {
  const { exams, tasks, sessions } = useApp()
  const [current, setCurrent] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = current.getFullYear(), month = current.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthName = current.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const dateStr = (day) => `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  const dayExams = (day) => exams.filter(e => e.exam_date === dateStr(day))
  const dayTasks = (day) => tasks.filter(t => t.due_date === dateStr(day))
  const daySessions = (day) => sessions.filter(s => s.session_date === dateStr(day))

  const prevMonth = () => setCurrent(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrent(new Date(year, month + 1, 1))
  const goToday = () => { setCurrent(new Date()); setSelectedDay(null) }

  const today = todayStr()
  const selectedEvents = selectedDay ? { exams: dayExams(selectedDay), tasks: dayTasks(selectedDay), sessions: daySessions(selectedDay) } : null

  return (
    <div className="cal-page">
      <div className="page-toolbar"><div><h2>Calendar</h2><p className="page-desc">Your exams, tasks, and study sessions</p></div></div>
      <div className="cal-header"><button className="btn btn-ghost btn-sm" onClick={prevMonth}>←</button><span className="cal-month">{monthName}</span><button className="btn btn-ghost btn-sm" onClick={nextMonth}>→</button><button className="btn btn-outline btn-sm" onClick={goToday}>Today</button></div>
      <div className="cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={i} className="cal-cell empty" />
          const ds = dateStr(day)
          const hasExams = dayExams(day).length > 0
          const hasTasks = dayTasks(day).length > 0
          const hasSessions = daySessions(day).length > 0
          return (
            <div key={i} className={`cal-cell ${ds === today ? 'today' : ''} ${selectedDay === day ? 'selected' : ''}`} onClick={() => setSelectedDay(day)}>
              <span className="cal-day">{day}</span>
              <div className="cal-dots">
                {hasExams && <span className="cal-dot" style={{ background: '#ef4444' }} />}
                {hasTasks && <span className="cal-dot" style={{ background: '#4f7cff' }} />}
                {hasSessions && <span className="cal-dot" style={{ background: '#22c55e' }} />}
              </div>
            </div>
          )
        })}
      </div>
      <div className="cal-legend"><span className="cal-legend-item"><span className="cal-dot" style={{ background: '#ef4444' }} /> Exams</span><span className="cal-legend-item"><span className="cal-dot" style={{ background: '#4f7cff' }} /> Tasks</span><span className="cal-legend-item"><span className="cal-dot" style={{ background: '#22c55e' }} /> Sessions</span></div>

      {selectedEvents && (
        <div className="cal-events">
          <h3>{monthName.split(' ')[0]} {selectedDay}</h3>
          {selectedEvents.exams.length === 0 && selectedEvents.tasks.length === 0 && selectedEvents.sessions.length === 0 ? <div className="dash-empty">Nothing scheduled for this day.</div> : (
            <div className="cal-event-list">
              {selectedEvents.exams.map(ex => <div key={ex.id} className="cal-event" style={{ borderLeft: '3px solid #ef4444' }}><span>📋 {ex.title}</span>{ex.subject && <span className="cal-event-sub">{ex.subject.name}</span>}</div>)}
              {selectedEvents.tasks.map(t => <div key={t.id} className="cal-event" style={{ borderLeft: '3px solid #4f7cff' }}><span>✅ {t.title}</span>{t.subject && <span className="cal-event-sub">{t.subject.name}</span>}</div>)}
              {selectedEvents.sessions.map(s => <div key={s.id} className="cal-event" style={{ borderLeft: '3px solid #22c55e' }}><span>⏱️ {s.duration_minutes} min session</span>{s.subject && <span className="cal-event-sub">{s.subject.name}</span>}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
