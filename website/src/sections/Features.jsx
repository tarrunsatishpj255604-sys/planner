import './Features.css'

const Icon = ({ d }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const features = [
  {
    icon: 'M3 3h18v4H3zM3 10h18v4H3zM3 17h18v4H3z',
    title: 'Smart Timetable',
    text: 'A two-week rotating timetable with custom lesson times, rooms and teachers. Cheon even auto-switches weeks for you.',
  },
  {
    icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
    title: 'Tasks & Homework',
    text: 'Track homework with due dates, subjects and notes. Overdue and current tasks are organised so nothing slips through.',
  },
  {
    icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
    title: 'Exams & Tests',
    text: 'Add exams with seats and locations, or class tests with content. Priority levels help you focus on what matters.',
  },
  {
    icon: 'M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    title: 'Pomodoro Study Timer',
    text: 'Built-in study sessions with configurable revision and break lengths, based on the proven Pomodoro Technique.',
  },
  {
    icon: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM3 9h18M9 21V9',
    title: 'Calendar Sync',
    text: 'Import events from your phone\'s calendars so your timeline always shows what\'s happening, in one place.',
  },
  {
    icon: 'M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 1 1-6 0v-1m6 0H9',
    title: 'Reminders & Notifications',
    text: 'Weekly homework reminders on the days you choose, so you never forget to check what\'s due.',
  },
]

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <span className="eyebrow">Everything in one place</span>
        <h2 className="section-title">Built for students, by students</h2>
        <p className="section-sub">
          Six powerful tools that work together to keep your academic life
          organised and stress-free.
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature">
              <div className="icon"><Icon d={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
