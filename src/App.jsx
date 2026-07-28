import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient.js'
import Landing from './pages/Landing.jsx'
import AuthModal from './components/AuthModal.jsx'
import Dashboard from './pages/Dashboard.jsx'

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

  const openAuth = (mode) => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 24, height: 24 }} />
      </div>
    )
  }

  if (session) {
    return <Dashboard session={session} />
  }

  return (
    <>
      <Landing onSignIn={() => openAuth('signin')} onSignUp={() => openAuth('signup')} />
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} mode={authMode} />
    </>
  )
}
