export default function Nav({ scrolled }) {
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" className="brand" aria-label="Study Planner home">
          <span className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </span>
          Study Planner
        </a>
        <nav>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#themes">Themes</a></li>
            <li><a href="#customise">Customise</a></li>
            <li><a href="#widgets">Widgets</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
        <div className="nav-cta">
          <a className="btn btn-ghost" href="#download">Sign in</a>
          <a className="btn btn-primary" href="#download">Get started</a>
          <button className="nav-toggle" aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
