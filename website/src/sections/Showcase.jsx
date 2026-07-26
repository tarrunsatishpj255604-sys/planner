import { useState } from 'react'
import './Showcase.css'

const panels = [
  {
    tab: 'Subjects',
    title: 'Every subject, beautifully organised',
    text: 'Track progress, grades, teachers and exam countdowns for each subject.',
    points: ['Custom icon and colour', 'Current grade and progress %', 'Exam countdown', 'Notes and resources'],
    rows: [
      { c: '#4caf50', t: 'Mathematics', s: 'Mr Lee · Room 214', r: '78%' },
      { c: '#2bbd7e', t: 'Physics', s: 'Ms Patel · Lab 3', r: '85%' },
      { c: '#fb8c00', t: 'Biology', s: 'Dr Khan · Room 8', r: 'Exam in 3d' },
    ],
  },
  {
    tab: 'Tasks',
    title: 'Never miss a deadline again',
    text: 'Homework, assignments and projects — sorted by priority and due date.',
    points: ['Priority levels 1–5', 'Recurring tasks', 'Tags and attachments', 'Progress status'],
    rows: [
      { c: '#2bbd7e', t: 'Physics lab report', s: 'Due tomorrow · P3', r: 'Tomorrow' },
      { c: '#e53935', t: 'History essay', s: 'Overdue · P5', r: '2 days late' },
      { c: '#4caf50', t: 'Maths worksheet', s: 'Due Friday · P2', r: 'Fri' },
    ],
  },
  {
    tab: 'Analytics',
    title: 'See your progress at a glance',
    text: 'Beautiful charts show study hours, productivity and subject performance.',
    points: ['Weekly and monthly comparison', 'Focus score tracking', 'Subject performance', 'Streak history'],
    rows: [
      { c: '#4caf50', t: 'Study hours', s: 'This week', r: '18.5h' },
      { c: '#2bbd7e', t: 'Tasks completed', s: 'This week', r: '23 / 28' },
      { c: '#fb8c00', t: 'Focus score', s: 'Average', r: '87%' },
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
        <h2 className="section-title">Designed to keep you on track</h2>
        <p className="section-sub">
          Every screen is crafted to give you the information you need at a glance.
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
