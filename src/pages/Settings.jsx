import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES } from '../lib/helpers.js'
import './SettingsPage.css'

const FONTS = ['Inter', 'Poppins', 'Roboto', 'JetBrains Mono', 'Playfair Display']
const COLOR_SWATCHES = ['#4f7cff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#6366f1', '#0ea5e9', '#a855f7']

export default function Settings() {
  const { settings, profile, loading, refresh, updateSettings, updateProfile } = useApp()
  const [theme, setTheme] = useState('default')
  const [primary, setPrimary] = useState('#4f7cff')
  const [accent, setAccent] = useState('#ec4899')
  const [font, setFont] = useState('Inter')
  const [radius, setRadius] = useState(12)
  const [animations, setAnimations] = useState(true)
  const [username, setUsername] = useState('')
  const [dailyGoal, setDailyGoal] = useState(120)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setTheme(settings.theme || 'default'); setPrimary(settings.primary_color || '#4f7cff')
      setAccent(settings.accent_color || '#ec4899'); setFont(settings.font || 'Inter')
      setRadius(settings.border_radius || 12); setAnimations(settings.animations !== false)
    }
    if (profile) { setUsername(profile.username || ''); setDailyGoal(profile.daily_goal_minutes || 120) }
  }, [settings, profile])

  if (loading || !settings) return <div className="set-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const saveAll = async () => {
    setSaving(true)
    await updateSettings({ theme, primary_color: primary, accent_color: accent, font, border_radius: radius, animations })
    if (profile) await updateProfile({ username, daily_goal_minutes: dailyGoal })
    refresh(); setSaving(false)
  }

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Settings</h2><p className="page-desc">Customize your StudySpace experience.</p></div>
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
      </div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`theme-card ${theme === key ? 'selected' : ''}`} onClick={() => setTheme(key)}>
              <div className="theme-preview" style={{ background: t.bg, border: `1px solid ${t.border}` }}>
                <div className="tp-surface" style={{ background: t.surface, borderColor: t.border }} />
                <div className="tp-accent" style={{ background: t.dark ? '#4f7cff' : t.text2 }} />
              </div>
              <span className="theme-name">{t.name}</span>
              {theme === key && <span className="theme-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Primary Color</h3></div>
          <div className="color-picker">
            {COLOR_SWATCHES.map(c => <button key={c} className={`color-swatch ${primary === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setPrimary(c)} />)}
          </div>
          <div className="custom-color-row">
            <input type="color" value={primary} onChange={e => setPrimary(e.target.value)} className="color-input" />
            <span className="color-hex">{primary}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Accent Color</h3></div>
          <div className="color-picker">
            {COLOR_SWATCHES.map(c => <button key={c} className={`color-swatch ${accent === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setAccent(c)} />)}
          </div>
          <div className="custom-color-row">
            <input type="color" value={accent} onChange={e => setAccent(e.target.value)} className="color-input" />
            <span className="color-hex">{accent}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Font</h3></div>
          <select className="set-select" value={font} onChange={e => setFont(e.target.value)}>
            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="card-head"><h3>Border Radius: {radius}px</h3></div>
          <input type="range" min="4" max="24" value={radius} onChange={e => setRadius(parseInt(e.target.value))} className="set-slider" />
          <div className="radius-preview" style={{ borderRadius: radius }}>Preview</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Animations</h3></div>
        <label className="switch-row">
          <span>Enable animations and transitions</span>
          <button className={`switch ${animations ? 'on' : ''}`} onClick={() => setAnimations(a => !a)}><span className="switch-knob" /></button>
        </label>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" /></div>
        <div className="form-field"><label>Daily study goal: {dailyGoal} min</label>
          <input type="range" min="30" max="480" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} className="set-slider" />
        </div>
      </div>

      <div className="set-save-bar">
        <button className="btn btn-primary" onClick={saveAll} disabled={saving}>{saving ? 'Saving...' : 'Save All Changes'}</button>
      </div>
    </div>
  )
}
