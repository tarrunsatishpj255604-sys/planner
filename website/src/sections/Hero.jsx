import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero-grid">
        <div className="hero-copy">
          <span className="eyebrow">Smart Study Planner</span>
          <h1>
            Plan smarter, <span className="accent">revise better</span>, ace your exams.
          </h1>
          <p className="lead">
            Cheon brings your timetable, tasks, exams and an intelligent
            revision planner into one beautiful app — so you always know what
            to study next.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#download">
              Get the app — it's free
            </a>
            <a className="btn btn-ghost" href="#features">
              See features
            </a>
          </div>
          <div className="hero-meta">
            <span className="stars">★★★★★</span>
            <span>4.8 on the App Store</span>
            <span className="dot" />
            <span>Loved by students worldwide</span>
          </div>
        </div>

        <div className="hero-visual">
          <div className="hero-blob one" />
          <div className="hero-blob two" />
          <div className="phone" aria-hidden="true">
            <div className="phone-notch" />
            <div className="phone-screen">
              <div className="phone-head">
                <span className="ptitle">Cheon</span>
                <span className="phone-date">Mon 12 Oct</span>
              </div>
              <div className="phone-card">
                <span className="bar" />
                <div>
                  <div className="ctitle">Maths · Period 1</div>
                  <div className="csub">Room 214 · 09:00</div>
                  <div className="phone-progress"><span /></div>
                </div>
              </div>
              <div className="phone-card alt">
                <span className="bar" />
                <div>
                  <div className="ctitle">Physics Homework</div>
                  <div className="csub">Due tomorrow</div>
                </div>
                <span className="ctime">16:30</span>
              </div>
              <div className="phone-card warn">
                <span className="bar" />
                <div>
                  <div className="ctitle">Biology Exam</div>
                  <div className="csub">In 3 days · Priority 5</div>
                </div>
                <span className="ctime">Hall A</span>
              </div>
              <div className="phone-card">
                <span className="bar" />
                <div>
                  <div className="ctitle">Study Session</div>
                  <div className="csub">Smart Revision · 25 min</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
