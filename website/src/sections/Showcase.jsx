import { useState } from 'react'
import './Showcase.css'

const panels = [
  {
    tab: 'Timetable',
    title: 'A timetable that adapts to you',
    text: 'Two-week rotating timetables with custom lesson times, rooms and teachers.',
    points: ['Auto week-switching', 'Saturday & Sunday support', 'Per-lesson notes & rooms'],
    rows: [
      { c: '#4caf50', t: 'Maths', s: 'Room 214 · Mr Lee', r: '09:00' },
      { c: '#2bbd7e', t: 'Physics', s: 'Lab 3 · Ms Patel', r: '10:00' },
      { c: '#fb8c00', t: 'Biology', s: 'Room 8 · Dr Khan', r: '11:00' },
    ],
  },
  {
    tab: 'Tasks',
    title: 'Never miss a deadline',
    text: 'Current, overdue and completed tasks — all sorted and colour-coded by subject.',
    points: ['Overdue warnings', 'Subject colour-coding', 'Quick complete checkbox'],
    rows: [
      { c: '#2bbd7e', t: 'Physics homework', s: 'Due tomorrow', r: '16:30' },
      { c: '#e53935', t: 'History essay', s: 'Overdue · 2 days', r: '!' },
      { c: '#4caf50', t: 'Maths worksheet', s: 'Due Fri', r: 'Fri' },
    ],
  },
  {
    tab: 'Assessments',
    title: 'Exams and tests, organised',
    text: 'See upcoming exams and tests grouped by Today, This Week, Next Week and beyond.',
    points: ['Priority levels 1–5', 'Seat & location tracking', 'Smart date grouping'],
    rows: [
      { c: '#e53935', t: 'Biology Exam', s: 'Hall A · Seat 14', r: '3 days' },
      { c: '#fb8c00', t: 'Maths Test', s: 'In class', r: '1 week' },
      { c: '#4caf50', t: 'Physics Quiz', s: 'Lab 3', r: '2 weeks' },
    ],
  },
]

export default function Showcase() {
  const [active, setActive] = useState(0)
  const panel = panels[active]
  return (
    <section className="section" id="showcase">
      <div className="container">
        <span className="eyebrow">Take a closer look</span>
        <h2 className="section-title">Beautiful, fast, and intuitive</h2>
        <p className="section-sub">
          Every screen is designed to give you the information you need at a glance.
        </p>

        <div className="showcase-tabs" role="tablist">
          {panels.map((p, i) => (
            <button
              key={p.tab}
              role="tab"
              aria-selected={i === active}
              className={`showcase-tab ${i === active ? 'active' : ''}`}
              onClick={() => setActive(i)}
            >
              {p.tab}
            </button>
          ))}
        </div>

        <div className="showcase-panel">
          <div className="showcase-text">
            <h3>{panel.title}</h3>
            <p>{panel.text}</p>
            <ul>
              {panel.points.map((pt) => (
                <li key={pt}>
                  <span className="tick">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                  </span>
                  {pt}
                </li>
              ))}
            </ul>
          </div>
          <div className="showcase-visual">
            <div className="mock-card">
              {panel.rows.map((r) => (
                <div key={r.t} className="mock-row">
                  <span className="swatch" style={{ background: r.c }} />
                  <div>
                    <div className="mt">{r.t}</div>
                    <div className="ms">{r.s}</div>
                  </div>
                  <span className="mr">{r.r}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
