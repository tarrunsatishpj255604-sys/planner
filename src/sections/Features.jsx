import './Features.css'

const Icon = ({ d }) => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const features = [
  {
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6',
    title: 'Home Dashboard',
    text: 'A beautiful overview with your day at a glance — classes, exams, tasks, streaks and more.',
    tags: ['Daily overview', 'Study streak', 'Quick actions', 'Weather widget'],
  },
  {
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    title: 'Subjects',
    text: 'Track every subject with custom icons, colours, teachers, grades, notes and exam countdowns.',
    tags: ['Custom icon', 'Colour', 'Teacher', 'Progress %', 'Grade', 'Resources'],
  },
  {
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4',
    title: 'Task Manager',
    text: 'Organise homework, assignments and projects with priorities, due dates, tags and reminders.',
    tags: ['Priority levels', 'Due dates', 'Reminders', 'Recurring', 'Tags', 'Attachments'],
  },
  {
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z',
    title: 'Calendar',
    text: 'Day, week and month views with drag-and-drop events, deadlines, exams and holidays.',
    tags: ['Day / Week / Month', 'Drag & drop', 'Google sync', 'Holidays'],
  },
  {
    icon: 'M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    title: 'Smart Notes',
    text: 'Rich text with Markdown, code blocks, images, PDFs, search, AI summaries and flashcards.',
    tags: ['Rich text', 'Markdown', 'Code blocks', 'AI summaries', 'Flashcards'],
  },
  {
    icon: 'M9 19V6l12-3v13M9 19c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3zm12-3c0 1.657-1.343 3-3 3s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z',
    title: 'Goals',
    text: 'Set semester, weekly and daily goals with progress bars, milestones and achievement badges.',
    tags: ['Semester goals', 'Milestones', 'Badges', 'Progress bars'],
  },
  {
    icon: 'M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0z',
    title: 'Pomodoro Timer',
    text: 'Custom timer lengths, auto breaks, focus mode, ambient sounds and session statistics.',
    tags: ['Custom lengths', 'Auto breaks', 'Focus mode', 'Ambient sounds'],
  },
  {
    icon: 'M3 3v18h18M7 14l4-4 3 3 5-6',
    title: 'Analytics',
    text: 'Charts for study hours, productivity, subject performance, streaks and focus score.',
    tags: ['Study hours', 'Productivity', 'Subject performance', 'Focus score'],
  },
  {
    icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 5.5L21 12l-5.5 2.5L13 20l-2.5-5.5L5 12l5.5-2.5L13 4z',
    title: 'Achievements',
    text: 'Unlock badges like 7-day streak, 100 study hours, early bird, night owl and exam crusher.',
    tags: ['7-day streak', '100 hours', 'Early bird', 'Exam crusher'],
  },
  {
    icon: 'M4 7v10c0 2 2 3 4 3h8c2 0 4-1 4-3V7M4 7l2-2h12l2 2M4 7h16M8 11h8M8 15h5',
    title: 'Resources',
    text: 'Organise PDFs, books, videos, links, documents, websites and past papers in one place.',
    tags: ['PDFs', 'Books', 'Videos', 'Past papers', 'Links'],
  },
  {
    icon: 'M17 20h5v-2a4 4 0 0 0-3-3.87M9 20H4v-2a4 4 0 0 1 3-3.87m6 5.87v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2m13-12a4 4 0 1 1-8 0 4 4 0 0 1 8 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM7 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z',
    title: 'Study Groups',
    text: 'Share notes and tasks, group chat, shared calendar and friendly leaderboards.',
    tags: ['Shared notes', 'Group chat', 'Shared calendar', 'Leaderboards'],
  },
  {
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    title: 'AI Assistant',
    text: 'Create study plans, explain topics, summarise notes, generate quizzes and flashcards.',
    tags: ['Study plans', 'Summaries', 'Quizzes', 'Flashcards', 'Revision schedules'],
  },
]

export default function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <span className="eyebrow">Everything in one place</span>
        <h2 className="section-title">Built for students who want more</h2>
        <p className="section-sub">
          Twelve powerful tools that work together to keep your academic life
          organised, motivating and on track.
        </p>
        <div className="features-grid">
          {features.map((f) => (
            <article key={f.title} className="feature">
              <div className="icon"><Icon d={f.icon} /></div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
              <div className="tags">
                {f.tags.map((t) => <span key={t}>{t}</span>)}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
