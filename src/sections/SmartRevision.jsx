import './SmartRevision.css'

export default function SmartRevision() {
  return (
    <section className="section revision" id="revision">
      <div className="container">
        <span className="eyebrow">Smart Revision</span>
        <h2 className="section-title">An AI-style planner that studies for you</h2>
        <p className="section-sub">
          Cheon combines your study preferences with your prioritised exams and
          tests to generate study blocks that suit you — automatically.
        </p>

        <div className="revision-grid">
          <div className="revision-visual" aria-hidden="true">
            <span className="rev-pill"><span className="dot" /> Generating…</span>
            <div className="rev-title">Today's study plan</div>
            <ul className="rev-list">
              <li className="done">
                <span className="check">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                </span>
                <span className="txt">Maths · Algebra revision · 25 min</span>
              </li>
              <li>
                <span className="check" />
                <span className="txt">Physics · Forces · 25 min</span>
              </li>
              <li>
                <span className="check" />
                <span className="txt">Break · 5 min</span>
              </li>
              <li>
                <span className="check" />
                <span className="txt">Biology · Cells · 25 min</span>
              </li>
            </ul>
          </div>

          <div className="revision-points">
            <div className="revision-point">
              <span className="num">1</span>
              <div>
                <h3>Learns your habits</h3>
                <p>Set your study window, session length and break preferences once. Cheon builds a schedule that fits your day.</p>
              </div>
            </div>
            <div className="revision-point">
              <span className="num">2</span>
              <div>
                <h3>Prioritises what matters</h3>
                <p>Higher-priority exams and tests get more study time, weighted by how much time remains before each one.</p>
              </div>
            </div>
            <div className="revision-point">
              <span className="num">3</span>
              <div>
                <h3>Auto-updates</h3>
                <p>Add a new exam and Cheon regenerates your study blocks to reflect the change — no manual rescheduling.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
