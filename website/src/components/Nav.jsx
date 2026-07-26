export default function Nav({ scrolled }) {
  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" className="brand" aria-label="Cheon home">
          <span className="brand-mark">C</span>
          Cheon
        </a>
        <nav>
          <ul className="nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#revision">Smart Revision</a></li>
            <li><a href="#showcase">Showcase</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
        <div className="nav-cta">
          <a className="btn btn-ghost" href="#download">Get the app</a>
          <button className="nav-toggle" aria-label="Open menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          </button>
        </div>
      </div>
    </header>
  )
}
