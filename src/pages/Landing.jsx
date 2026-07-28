import './Landing.css'
export default function Landing({ onSignIn, onSignUp }) {
  return (
    <div className="landing">
      <nav className="nav"><div className="nav-inner">
        <a className="brand" href="#top"><span className="brand-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span><span>StudySpace</span></a>
        <div className="nav-actions">
          <button className="btn btn-ghost btn-sm" onClick={onSignIn}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={onSignUp}>Get started</button>
        </div>
      </div></nav>
      <header id="top" className="hero"><div className="hero-bg" /><div className="hero-inner">
        <div className="hero-badge">Free forever — no credit card needed</div>
        <h1>Plan your best<br />year yet.</h1>
        <p className="hero-sub">A clean, focused study planner for students. Track subjects, manage tasks, study with focus timers, create flashcards, and watch your progress grow.</p>
        <div className="hero-cta">
          <button className="btn btn-primary" onClick={onSignUp} style={{ padding: '14px 28px', fontSize: 15 }}>Start planning — it's free</button>
          <button className="btn btn-outline" onClick={onSignIn} style={{ padding: '14px 28px', fontSize: 15 }}>I already have an account</button>
        </div>
        <div className="hero-preview"><div className="preview-window"><div className="preview-bar"><span /><span /><span /></div>
          <div className="preview-content"><div className="preview-sidebar">
            <div className="ps-item active"><div className="ps-dot" style={{ background: '#4f7cff' }} /> Dashboard</div>
            <div className="ps-item"><div className="ps-dot" style={{ background: '#22c55e' }} /> Subjects</div>
            <div className="ps-item"><div className="ps-dot" style={{ background: '#f59e0b' }} /> Tasks</div>
            <div className="ps-item"><div className="ps-dot" style={{ background: '#ec4899' }} /> Focus</div>
          </div><div className="preview-main">
            <div className="pc-card"><div className="pc-line wide" /><div className="pc-line" /><div className="pc-line short" /></div>
            <div className="pc-row"><div className="pc-card sm"><div className="pc-line short" /><div className="pc-line wide" /></div><div className="pc-card sm"><div className="pc-line short" /><div className="pc-line wide" /></div></div>
          </div></div>
        </div></div>
      </div></header>
      <section className="features"><div className="features-inner">
        <h2>Everything you need to stay on track</h2>
        <div className="feature-grid">
          {[
            { icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z', title: 'Subjects', desc: 'Create custom subjects with icons, colors, and target grades. Each has its own page with notes, flashcards, and more.', color: '#4f7cff', bg: '#e8efff' },
            { icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', title: 'Tasks', desc: 'Track assignments with priority, difficulty, due dates, and subject tags. Archive completed tasks.', color: '#f59e0b', bg: '#fef4e6' },
            { icon: 'M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z', title: 'Focus Timer', desc: 'Pomodoro, stopwatch, and countdown modes. Log sessions to earn XP and build streaks.', color: '#ec4899', bg: '#fce7f3' },
            { icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6', title: 'Notes', desc: 'Rich text notes with folders, tags, pinning, favorites, search, and auto-save.', color: '#8b5cf6', bg: '#f3e8ff' },
            { icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M7 9h10 M7 13h6', title: 'Flashcards', desc: 'Create cards with spaced repetition. Quiz mode, star difficult cards, and track review schedules.', color: '#06b6d4', bg: '#e0f7fe' },
            { icon: 'M3 3v18h18M7 14l4-4 3 3 5-5', title: 'Analytics', desc: 'Beautiful charts showing hours studied, weekly progress, subject comparison, and a heatmap.', color: '#22c55e', bg: '#e8f9ee' },
          ].map((f, i) => (
            <div key={i} className="feature-card">
              <div className="f-icon" style={{ background: f.bg, color: f.color }}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg></div>
              <h3>{f.title}</h3><p>{f.desc}</p>
            </div>
          ))}
        </div>
      </div></section>
      <section className="cta-section"><div className="cta-inner">
        <h2>Ready to plan your best year?</h2>
        <button className="btn btn-primary" onClick={onSignUp} style={{ padding: '14px 32px', fontSize: 15 }}>Create your free account</button>
      </div></section>
      <footer className="footer"><div className="footer-inner">
        <div className="brand" style={{ fontSize: 15 }}><span className="brand-icon" style={{ width: 28, height: 28 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span><span>StudySpace</span></div>
        <p>Plan smarter. Study better.</p>
      </div></footer>
    </div>
  )
}
