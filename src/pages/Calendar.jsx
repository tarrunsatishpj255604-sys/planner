import { useState, useMemo } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { formatDate } from '../lib/helpers.js';
import './CalendarPage.css';

export default function Calendar() {
  const { subjects, tasks, sessions, exams } = useApp();
  const [cursor, setCursor] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const monthName = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    return cells;
  }, [year, month]);

  const eventsFor = (date) => {
    if (!date) return [];
    const ds = date.toISOString().slice(0, 10);
    const ev = [];
    (exams || []).forEach(e => { if ((e.date || '').slice(0, 10) === ds) ev.push({ type: 'exam', label: e.title, color: '#ef4444' }); });
    (tasks || []).forEach(t => { if ((t.due_date || '').slice(0, 10) === ds && !t.archived) ev.push({ type: 'task', label: t.title, color: '#3b82f6' }); });
    (sessions || []).forEach(s => { if ((s.date || s.created_at || '').slice(0, 10) === ds) ev.push({ type: 'session', label: `Session ${s.duration}m`, color: '#22c55e' }); });
    return ev;
  };

  const today = new Date(); const todayStrCal = today.toISOString().slice(0, 10);
  const selectedEvents = selected ? eventsFor(selected) : [];

  return (
    <div className="calendar-page">
      <div className="page-toolbar">
        <div><h2>Calendar</h2><p className="page-desc">Your schedule at a glance</p></div>
      </div>

      <div className="card">
        <div className="cal-nav">
          <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month - 1, 1))}>←</button>
          <h3>{monthName}</h3>
          <button className="btn btn-ghost" onClick={() => setCursor(new Date(year, month + 1, 1))}>→</button>
          <button className="btn btn-outline btn-sm" onClick={() => { setCursor(new Date(today.getFullYear(), today.getMonth(), 1)); setSelected(today); }}>Today</button>
        </div>

        <div className="cal-grid">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="cal-dow">{d}</div>)}
          {days.map((date, i) => {
            if (!date) return <div key={i} className="cal-cell empty" />;
            const ds = date.toISOString().slice(0, 10);
            const ev = eventsFor(date);
            const isToday = ds === todayStrCal;
            const isSelected = selected && date.toDateString() === selected.toDateString();
            return (
              <button
                key={i}
                className={`cal-cell ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelected(date)}
              >
                <span className="cal-day">{date.getDate()}</span>
                <span className="cal-dots">
                  {ev.some(e => e.type === 'exam') && <span className="dot red" />}
                  {ev.some(e => e.type === 'task') && <span className="dot blue" />}
                  {ev.some(e => e.type === 'session') && <span className="dot green" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="cal-legend">
          <span><span className="dot red" /> Exams</span>
          <span><span className="dot blue" /> Tasks</span>
          <span><span className="dot green" /> Sessions</span>
        </div>
      </div>

      {selected && (
        <div className="card">
          <div className="card-head"><h3>{formatDate(selected.toISOString())}</h3></div>
          {selectedEvents.length === 0 ? (
            <div className="empty-state"><p>No events this day</p></div>
          ) : (
            <ul className="cal-events">
              {selectedEvents.map((e, i) => (
                <li key={i}><span className="dot" style={{ background: e.color }} /><span>{e.label}</span></li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
