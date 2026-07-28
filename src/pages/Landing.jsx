import { useState, useEffect } from 'react'
import './Landing.css'

export default function Landing({ onSignIn, onSignUp }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="landing">
      <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-inner">
          <a className="brand" href="#top">
            <span className="brand-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
            </span>
            <span>StudyPlanner</span>
          </a>
          <div className="nav-actions">
            <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign in</button>
            <button className="btn btn-primary btn-sm" onClick={onSignUp}>Get started</button>
          </div>
        </div>
      </nav>

      <header id="top" className="hero">
        <div className="hero-bg" />
        <div className="hero-inner">
          <div className="hero-badge">Free forever — no credit card needed</div>
          <h1>Plan your best<br />year yet.</h1>
          <p className="hero-sub">
            A clean, focused study planner for students. Track your subjects,
            manage assignments, and time your study sessions — all in one place.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={onSignUp} style={{ padding: '14px 28px', fontSize: 15 }}>
              Start planning — it's free
            </button>
            <button className="btn btn-outline" onClick={onSignIn} style={{ padding: '14px 28px', fontSize: 15 }}>
              I already have an account
            </button>
          </div>

          <div className="hero-preview">
            <div className="preview-window">
              <div className="preview-bar">
                <span /><span /><span />
              </div>
              <div className="preview-content">
                <div className="preview-sidebar">
                  <div className="ps-item active"><div className="ps-dot" style={{ background: '#4f7cff' }} /> Dashboard</div>
                  <div className="ps-item"><div className="ps-dot" style={{ background: '#22c55e' }} /> Subjects</div>
                  <div className="ps-item"><div className="ps-dot" style={{ background: '#f59e0b' }} /> Tasks</div>
                  <div className="ps-item"><div className="ps-dot" style={{ background: '#ec4899' }} /> Timer</div>
                </div>
                <div className="preview-main">
                  <div className="pc-card">
                    <div className="pc-line wide" />
                    <div className="pc-line" />
                    <div className="pc-line short" />
                  </div>
                  <div className="pc-row">
                    <div className="pc-card sm"><div className="pc-line short" /><div className="pc-line wide" /></div>
                    <div className="pc-card sm"><div className="pc-line short" /><div className="pc-line wide" /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="features">
        <div className="features-inner">
          <h2>Everything you need to stay on track</h2>
          <div className="feature-grid">
            <div className="feature-card">
              <div className="f-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
              </div>
              <h3>Subjects</h3>
              <p>Organize your courses with custom colors and target grades so you always know what needs attention.</p>
            </div>
            <div className="feature-card">
              <div className="f-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              </div>
              <h3>Tasks</h3>
              <p>Add assignments, set due dates, and mark priorities. Never miss a deadline with the clear overview.</p>
            </div>
            <div className="feature-card">
              <div className="f-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /><path d="M5 3 2 6" /><path d="m22 6-3-3" /></svg>
              </div>
              <h3>Study Timer</h3>
              <p>Focus with a built-in timer that logs your study sessions per subject. See your progress grow over time.</p>
            </div>
            <div className="feature-card">
              <div className="f-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>
              </div>
              <h3>Progress</h3>
              <p>Visual stats show tasks completed and study hours logged. Stay motivated with real numbers.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-inner">
          <h2>Ready to plan your best year?</h2>
          <p>Join thousands of students staying organized and ahead of their deadlines.</p>
          <button className="btn btn-primary" onClick={onSignUp} style={{ padding: '14px 32px', fontSize: 15 }}>
            Create your free account
          </button>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <div className="brand" style={{ fontSize: 15 }}>
            <span className="brand-icon" style={{ width: 28, height: 28 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
            </span>
            <span>StudyPlanner</span>
          </div>
          <p>Plan smarter. Study better.</p>
        </div>
      </footer>
    </div>
  )
}
