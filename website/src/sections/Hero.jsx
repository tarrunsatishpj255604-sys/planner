import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">All-in-one Study Planner</span>
          <h1>
            Organise your academic life, <span className="accent">all in one place</span>
          </h1>
          <p className="lead">
            A modern study planner for students. Manage subjects, homework,
            exams, notes, study sessions, goals, and productivity from a
            beautiful, customisable dashboard.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#download">Start planning free</a>
            <a className="btn btn-ghost" href="#features">Explore features</a>
          </div>
          <div className="hero-meta">
            <span className="stars">★★★★★</span>
            <span>Loved by 50,000+ students</span>
            <span className="dot" />
            <span>Free forever</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob one" />
          <div className="hero-blob two" />
          <div className="dash" aria-hidden="true">
            <div className="dash-top">
              <div className="dots"><span /><span /><span /></div>
              <span className="title">Dashboard · Monday</span>
            </div>
            <div className="dash-body">
              <div className="dash-welcome">
                <div>
                  <div className="hi">Good morning, Alex!</div>
                  <div className="sub">You have 3 tasks and 1 exam this week</div>
                </div>
                <div className="streak">🔥 12 day streak</div>
              </div>
              <div className="dash-grid">
                <div className="dash-card">
                  <div className="label">Study hours</div>
                  <div className="value">18.5h</div>
                  <div className="sub">This week</div>
                  <div className="bar"><span style={{ width: '74%' }} /></div>
                </div>
                <div className="dash-card">
                  <div className="label">Tasks done</div>
                  <div className="value">7 / 9</div>
                  <div className="sub">Today</div>
                  <div className="bar"><span style={{ width: '78%' }} /></div>
                </div>
              </div>
              <div className="dash-list">
                <div className="dash-task done">
                  <span className="check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg></span>
                  <span className="txt">Maths worksheet</span>
                  <span className="tag">Maths</span>
                </div>
                <div className="dash-task">
                  <span className="check" />
                  <span className="txt">Physics lab report</span>
                  <span className="tag">Physics</span>
                </div>
                <div className="dash-task">
                  <span className="check" />
                  <span className="txt">Read chapter 4 — Biology</span>
                  <span className="tag">Biology</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
