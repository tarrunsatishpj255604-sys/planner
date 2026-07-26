import { useState } from 'react'
import './FAQ.css'

const faqs = [
  {
    q: 'Is Study Planner free to use?',
    a: 'Yes! Study Planner is free forever with no credit card required. All core planning features — subjects, tasks, calendar, notes, goals, timer and analytics — are included at no cost.',
  },
  {
    q: 'Which platforms is it available on?',
    a: 'Study Planner works on the web, iOS and Android. Your data syncs seamlessly across all your devices so you can pick up where you left off.',
  },
  {
    q: 'Can I customise the dashboard?',
    a: 'Absolutely. You can drag, resize and rearrange any of the 13 available widgets. You can also hide widgets you don\'t need and choose where your sidebar sits.',
  },
  {
    q: 'How many themes are available?',
    a: 'There are 11 built-in themes ranging from Midnight and Emerald to Cyberpunk and Aurora. You can also fine-tune accent colours, fonts, card radius, glassmorphism and density.',
  },
  {
    q: 'Does it support Pomodoro studying?',
    a: 'Yes. The built-in Pomodoro timer supports custom lengths, automatic breaks, focus mode, ambient sounds and session history with statistics.',
  },
  {
    q: 'Is my data private and secure?',
    a: 'Your data is stored securely and only accessible to you. Calendar sync is opt-in, and we never sell your data to third parties.',
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
