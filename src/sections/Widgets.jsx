import './Widgets.css'

const Ic = ({ d }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const widgets = [
  { d: 'M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z', t: 'Calendar', s: 'Month view at a glance' },
  { d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253', t: 'Timetable', s: 'Today\'s class schedule' },
  { d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2', t: 'Tasks', s: 'What\'s due today' },
  { d: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z', t: 'Study Timer', s: 'Pomodoro sessions' },
  { d: 'M13 10V3L4 14h7v7l9-11h-7z', t: 'Study Streak', s: 'Keep the fire going' },
  { d: 'M3 15h4l2-8 4 16 2-8h6', t: 'Weather', s: 'Plan around the forecast' },
  { d: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z', t: 'Notes', s: 'Quick capture ideas' },
  { d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 5.5L21 12l-5.5 2.5L13 20l-2.5-5.5L5 12l5.5-2.5L13 4z', t: 'Goals', s: 'Track your targets' },
  { d: 'M3 3v18h18M7 14l4-4 3 3 5-6', t: 'Progress Chart', s: 'Visualise your hours' },
  { d: 'M9 12l2 2 4-4M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18z', t: 'Upcoming Exams', s: 'Never get caught out' },
  { d: 'M4 4h16v16H4zM8 4v16M4 8h16', t: 'Subject Cards', s: 'Jump to any subject' },
  { d: 'M9 12h6M9 16h6M9 8h6M5 4h14v16H5z', t: 'Motivation Quote', s: 'Daily inspiration' },
]

export default function Widgets() {
  return (
    <section className="section widgets-section" id="widgets">
      <div className="container">
        <span className="eyebrow">Your dashboard, your way</span>
        <h2 className="section-title">Drag, resize and rearrange widgets</h2>
        <p className="section-sub">
          Build a dashboard that works for you. Every widget can be moved,
          resized or hidden — put what matters most front and centre.
        </p>
        <div className="widgets-grid">
          {widgets.map((w) => (
            <div key={w.t} className="widget">
              <div className="wic"><Ic d={w.d} /></div>
              <h4>{w.t}</h4>
              <p>{w.s}</p>
            </div>
          ))}
        </div>
        <p className="widget-note">
          <strong>13 widgets</strong> available — and more on the way.
        </p>
      </div>
    </section>
  )
}
