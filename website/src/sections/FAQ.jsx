import { useState } from 'react'
import './FAQ.css'

const faqs = [
  {
    q: 'Is Cheon free to use?',
    a: 'Yes! Cheon Smart Planner is free to download on both the App Store and Google Play, with no subscription required for the core planning features.',
  },
  {
    q: 'Which platforms does Cheon support?',
    a: 'Cheon is available on iOS and Android. The app is built with Flutter, so it runs natively on both platforms with a consistent experience.',
  },
  {
    q: 'How does Smart Revision work?',
    a: 'Smart Revision combines your study window, session length and break preferences with your prioritised exams and tests to generate tailored study blocks. It automatically re-plans when you add or change assessments.',
  },
  {
    q: 'Can I sync my phone calendar?',
    a: 'Yes. Cheon can import events from your device calendars so they appear alongside your lessons and tasks in the timeline view.',
  },
  {
    q: 'Is my data private?',
    a: 'Your timetable, tasks and study data are stored locally on your device. Calendar access is only used to display events you choose to import.',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState(0)
  return (
    <section className="section" id="faq">
      <div className="container">
        <span className="eyebrow">Questions</span>
        <h2 className="section-title">Frequently asked questions</h2>
        <div className="faq-list">
          {faqs.map((f, i) => (
            <div key={f.q} className={`faq-item ${i === open ? 'open' : ''}`}>
              <button className="faq-q" onClick={() => setOpen(i === open ? -1 : i)} aria-expanded={i === open}>
                {f.q}
                <svg className="chev" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">{f.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
