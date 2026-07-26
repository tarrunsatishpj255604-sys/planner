import './CTA.css'

export default function CTA() {
  return (
    <section className="cta" id="download">
      <div className="container">
        <div className="cta-card">
          <span className="eyebrow">Get started free</span>
          <h2>Start planning your best year yet</h2>
          <p>
            Join over 50,000 students who organise their academic life with
            Study Planner. Free forever — no credit card required.
          </p>
          <div className="cta-actions">
            <a className="btn btn-primary" href="#download">Create free account</a>
            <a className="btn btn-ghost" href="#features">See all features</a>
          </div>
        </div>
      </div>
    </section>
  )
}
