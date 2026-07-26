import './CTA.css'

export default function CTA() {
  return (
    <section className="cta" id="download">
      <div className="container">
        <div className="cta-card">
          <span className="eyebrow">Get started free</span>
          <h2>Take control of your studies today</h2>
          <p>
            Cheon Smart Planner is free to download on iOS and Android.
            Join thousands of students who plan smarter with Cheon.
          </p>
          <div className="cta-actions">
            <a className="store-badge" href="#download">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 12.04c-.03-2.62 2.14-3.88 2.24-3.94-1.22-1.79-3.13-2.04-3.81-2.07-1.62-.17-3.17.95-3.99.95-.83 0-2.1-.93-3.46-.9-1.78.03-3.43 1.04-4.35 2.64-1.86 3.23-.48 8.01 1.33 10.63.89 1.28 1.94 2.71 3.32 2.66 1.34-.06 1.84-.86 3.46-.86 1.61 0 2.08.86 3.5.83 1.45-.03 2.36-1.3 3.24-2.59 1.03-1.49 1.45-2.95 1.47-3.03-.03-.01-2.82-1.08-2.85-4.28zM14.52 4.3c.74-.9 1.24-2.15 1.1-3.4-1.06.04-2.35.71-3.12 1.6-.68.79-1.28 2.06-1.12 3.28 1.18.09 2.39-.6 3.14-1.48z"/></svg>
              <span><small>Download on the</small><strong>App Store</strong></span>
            </a>
            <a className="store-badge" href="#download">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 23.07c-.36-.36-.56-.95-.56-1.74V2.67c0-.79.2-1.38.56-1.74L13.5 12 3.18 23.07zM14.66 13.15l2.86-1.65-2.36-1.36-2.7 1.56 2.2 1.45zM6.2 1.06l11.32 6.54-2.36 1.36L6.2 1.06zM4.6 23.5l11.98-6.93 2.36 1.36L4.6 23.5zM18.4 9.74l2.86 1.65c.7.4.7 1.4 0 1.8l-2.86 1.65-2.6-1.5 2.6-1.6z"/></svg>
              <span><small>Get it on</small><strong>Google Play</strong></span>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
