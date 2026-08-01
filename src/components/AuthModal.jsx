import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './AuthModal.css'

export default function AuthModal({ open, onClose, mode: initialMode }) {
  const [mode, setMode] = useState(initialMode || 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [signupEmailSent, setSignupEmailSent] = useState(false)

  useEffect(() => {
    if (open) { setMode(initialMode || 'signin'); setError(''); setEmail(''); setPassword(''); setResetSent(false); setSignupEmailSent(false) }
  }, [open, initialMode])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    if (open) window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('')
    if (!email.trim() || !password) { setError('Please enter your email and password.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password })
        if (error) throw error
        if (data?.user) {
          setSignupEmailSent(true)
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
        if (error) throw error
        onClose()
      }
    } catch (err) {
      const msg = err?.message || 'Something went wrong.'
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) setError('Could not reach the server. Please check your connection.')
      else if (msg.includes('Invalid login')) setError('Incorrect email or password.')
      else setError(msg)
    } finally { setLoading(false) }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault(); setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: window.location.origin })
      if (error) throw error
      setResetSent(true)
    } catch (err) {
      const msg = err?.message || 'Something went wrong.'
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) setError('Could not reach the server. Please check your connection.')
      else setError(msg)
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-card" onClick={(e) => e.stopPropagation()}>
        <button className="auth-close" onClick={onClose}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
        {mode === 'reset' ? (
          <>
            <div className="auth-head"><span className="brand-mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span><h2>Reset your password</h2><p>Enter your email and we'll send you a link to reset your password.</p></div>
            {resetSent ? (
              <div className="auth-body"><div className="auth-success"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>Check your inbox — we've sent a password reset link to your email.</div><button className="btn btn-primary auth-submit" onClick={() => { setMode('signin'); setResetSent(false); setError('') }}>Back to sign in</button></div>
            ) : (
              <form className="auth-body" onSubmit={handleResetPassword}>
                {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{error}</div>}
                <div className="auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" disabled={loading} /></div>
                <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading && <span className="spinner" />}{loading ? 'Sending…' : 'Send reset link'}</button>
                <div className="auth-foot">Remember your password?<button type="button" onClick={() => { setMode('signin'); setError('') }}>Sign in</button></div>
              </form>
            )}
          </>
        ) : (
          <>
            <div className="auth-head"><span className="brand-mark"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg></span><h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2><p>{mode === 'signup' ? 'Start planning your best year yet.' : 'Sign in to sync your subjects, tasks and progress.'}</p></div>
            <div className="auth-tabs"><button className={`auth-tab ${mode === 'signin' ? 'active' : ''}`} onClick={() => { setMode('signin'); setError('') }}>Sign in</button><button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>Sign up</button></div>
            {signupEmailSent ? (
              <div className="auth-body"><div className="auth-success"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>Check your inbox — we've sent a confirmation link to your email. Click it to activate your account and start studying.</div><button className="btn btn-primary auth-submit" onClick={() => { setSignupEmailSent(false); setMode('signin'); setError('') }}>Back to sign in</button></div>
            ) : (
            <form className="auth-body" onSubmit={handleSubmit}>
              {error && <div className="auth-error"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" /></svg>{error}</div>}
              <div className="auth-field"><label htmlFor="auth-email">Email</label><input id="auth-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" autoComplete="email" disabled={loading} /></div>
              <div className="auth-field"><label htmlFor="auth-password">Password</label><input id="auth-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} disabled={loading} /></div>
              {mode === 'signin' && <button type="button" className="auth-forgot-link" onClick={() => { setMode('reset'); setError(''); setPassword('') }}>Forgot your password?</button>}
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>{loading && <span className="spinner" />}{loading ? 'Please wait…' : (mode === 'signup' ? 'Create account' : 'Sign in')}</button>
              <div className="auth-foot">{mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}<button type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>{mode === 'signin' ? 'Sign up' : 'Sign in'}</button></div>
            </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}
