import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import AuthModal from './AuthModal.jsx'
import './Nav.css'

export default function Nav({ scrolled }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('signin')
  const [session, setSession] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const openAuth = (mode) => {
    setModalMode(mode)
    setModalOpen(true)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const initials = session?.user?.email
    ? session.user.email.slice(0, 2).toUpperCase()
    : ''

  return (
    <>
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
            </ul>
          </nav>
          <div className="nav-cta">
            {session ? (
              <div className="auth-user">
                <span className="auth-avatar">{initials}</span>
                <div className="auth-user-info">
                  <div className="name">Signed in</div>
                  <div className="email">{session.user.email}</div>
                </div>
                <button className="btn btn-ghost" onClick={handleSignOut}>Sign out</button>
              </div>
            ) : (
              <>
                <button className="btn btn-ghost" onClick={() => openAuth('signin')}>Sign in</button>
                <button className="btn btn-primary" onClick={() => openAuth('signup')}>Get started</button>
              </>
            )}
            <button className="nav-toggle" aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
          </div>
        </div>
      </header>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} mode={modalMode} />
    </>
  )
}
