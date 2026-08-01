import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { AppProvider } from './lib/AppContext.jsx'
import Landing from './pages/Landing.jsx'
import AuthModal from './components/AuthModal.jsx'
import Shell from './Shell.jsx'

export default function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('signin')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => { setSession(sess) })
    return () => sub.subscription.unsubscribe()
  }, [])

  const openAuth = (mode) => { setAuthMode(mode); setAuthOpen(true) }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f8fc' }}><div className="spinner" style={{ borderColor: '#e2e6ef', borderTopColor: '#4f7cff', width: 28, height: 28 }} /></div>

  if (session) {
    const emailConfirmed = session.user?.email_confirmed_at || session.user?.confirmed_at
    if (!emailConfirmed) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f8fc', padding: 24, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: '#4f7cff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#1a1f36', marginBottom: 8 }}>Confirm your email</h2>
          <p style={{ fontSize: 15, color: '#5a6378', maxWidth: 400, lineHeight: 1.6, marginBottom: 20 }}>We sent a confirmation link to <strong style={{ color: '#1a1f36' }}>{session.user?.email}</strong>. Click the link in the email to activate your account and start studying.</p>
          <p style={{ fontSize: 13, color: '#9ca3b8', marginBottom: 24 }}>Didn't get the email? Check your spam folder.</p>
          <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={async () => { await supabase.auth.signOut() }}>Back to sign in</button>
        </div>
      )
    }
    return <AppProvider session={session}><Shell session={session} /></AppProvider>
  }

  return <><Landing onSignIn={() => openAuth('signin')} onSignUp={() => openAuth('signup')} /><AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} /></>
}
