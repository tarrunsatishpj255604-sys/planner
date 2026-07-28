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
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const openAuth = (mode) => { setAuthMode(mode); setAuthOpen(true) }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f7f8fc' }}>
        <div className="spinner" style={{ borderColor: '#e2e6ef', borderTopColor: '#4f7cff', width: 28, height: 28 }} />
      </div>
    )
  }

  if (session) {
    return (
      <AppProvider session={session}>
        <Shell session={session} />
      </AppProvider>
    )
  }

  return (
    <>
      <Landing onSignIn={() => openAuth('signin')} onSignUp={() => openAuth('signup')} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} />
    </>
  )
}
