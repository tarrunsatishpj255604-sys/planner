import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './AuthModal.css'
export default function AuthModal({ open, onClose, mode: initialMode }) {
  const [mode, setMode] = useState(initialMode || 'signin')
  const [email, setEmail] = useState(''), [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false), [error, setError] = useState('')
  useEffect(() => { if (open) { setMode(initialMode || 'signin'); setError(''); setEmail(''); setPassword('') } }, [open, initialMode])
  useEffect(() => { const onKey = (e) => { if (e.key === 'Escape') onClose() }; if (open) window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey) }, [open, onClose])
  if (!open) return null
  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      if (mode === 'signup') { const { data, error } = await supabase.auth.signUp({ email: email.trim(), password }); if (error) throw error; if (data?.user) onClose() }
      else { const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) throw error; onClose() }
    } catch (err) {
      const msg = err?.message || 'Something went wrong.'
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) setError('Could not reach the server. Please check your connection.')
      else if (msg.includes('Invalid login')) setError('Incorrect email or password.')
      else setError(msg)
    } finally { setLoading(false) }
  }
  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        <div className="auth-head">
          <span className="brand-mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span>
          <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p>{mode === 'signup' ? 'Start planning your best year yet — free forever.' : 'Sign in to sync your subjects, tasks and progress.'}</p>
        </div>
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError('') }}>Sign in</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
        </div>
        <form className="auth-body" onSubmit={handleSubmit}>
          {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{error}</div>}
          <div className="auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" disabled={loading} /></div>
          <div className="auth-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} disabled={loading} /></div>
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading && <span className="spinner" />}{loading ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
          <div className="auth-foot">{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}<button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</button></div>
        </form>
      </div>
    </div>
  )
}
