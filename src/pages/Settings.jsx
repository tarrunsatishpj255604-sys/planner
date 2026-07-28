import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, SUBJECT_COLORS, AVATAR_OPTIONS } from '../lib/helpers.js'
import './SettingsPage.css'

const FONTS = ['Inter', 'Poppins', 'Roboto', 'JetBrains Mono', 'Playfair Display']

export default function Settings() {
  const { settings, profile, loading, updateSettings, updateProfile, refresh } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || '🦊')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  const theme = settings?.theme || 'default'
  const primaryColor = settings?.primary_color || '#4f7cff'
  const accentColor = settings?.accent_color || '#ec4899'
  const font = settings?.font || 'Inter'
  const borderRadius = settings?.border_radius || 12
  const animations = settings?.animations !== false

  const saveTheme = async (t) => { await updateSettings({ theme: t }); refresh() }
  const savePrimary = async (c) => { await updateSettings({ primary_color: c }); refresh() }
  const saveAccent = async (c) => { await updateSettings({ accent_color: c }); refresh() }
  const saveFont = async (f) => { await updateSettings({ font: f }); refresh() }
  const saveRadius = async (r) => { await updateSettings({ border_radius: r }); refresh() }
  const saveAnimations = async (a) => { await updateSettings({ animations: a }); refresh() }

  const saveAccount = async () => {
    setSaving(true)
    await updateProfile({ username: username.trim(), avatar_emoji: avatar, daily_goal_minutes: dailyGoal })
    setSaving(false); refresh()
  }

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Settings</h2>
          <p className="page-desc">Customize your StudySpace experience.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>🎨 Theme</h3></div>
        <div className="settings-theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`settings-theme-card ${theme === key ? 'active' : ''}`} onClick={() => saveTheme(key)}>
              <div className="settings-theme-preview" style={{ background: t.bg }}>
                <div className="settings-theme-surface" style={{ background: t.surface, border: `1px solid ${t.border}` }}>
                  <div className="settings-theme-bar" style={{ background: key === 'default' ? '#4f7cff' : t.text }} />
                  <div className="settings-theme-bar sm" style={{ background: t.text2 }} />
                </div>
              </div>
              <span className="settings-theme-name">{t.name}</span>
              {theme === key && <span className="settings-theme-check">✓</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Primary Color</h3></div>
          <div className="color-picker" style={{ marginBottom: 12 }}>
            {SUBJECT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${primaryColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => savePrimary(c)} />
            ))}
          </div>
          <div className="settings-color-input">
            <label>Custom:</label>
            <input type="color" value={primaryColor} onChange={e => savePrimary(e.target.value)} />
            <span>{primaryColor}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Accent Color</h3></div>
          <div className="color-picker" style={{ marginBottom: 12 }}>
            {SUBJECT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${accentColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => saveAccent(c)} />
            ))}
          </div>
          <div className="settings-color-input">
            <label>Custom:</label>
            <input type="color" value={accentColor} onChange={e => saveAccent(e.target.value)} />
            <span>{accentColor}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Font Family</h3></div>
          <select className="settings-font-select" value={font} onChange={e => saveFont(e.target.value)}>
            {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
          <p className="settings-font-preview" style={{ fontFamily: font }}>The quick brown fox jumps over the lazy dog.</p>
        </div>

        <div className="card">
          <div className="card-head"><h3>Border Radius: {borderRadius}px</h3></div>
          <input type="range" min="4" max="24" step="1" value={borderRadius} onChange={e => saveRadius(parseInt(e.target.value))} className="settings-slider" />
          <div className="settings-radius-preview">
            <div className="settings-radius-box" style={{ borderRadius: `${borderRadius}px` }}>Preview</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Animations</h3></div>
        <div className="settings-toggle-row">
          <span>Enable animations and transitions</span>
          <button className={`settings-toggle ${animations ? 'on' : ''}`} onClick={() => saveAnimations(!animations)}>
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field">
          <label>Username</label>
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Avatar</label>
          <div className="avatar-picker">
            {AVATAR_OPTIONS.map(a => (
              <button key={a} className={`avatar-pick ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
            ))}
          </div>
        </div>
        <div className="form-field">
          <label>Daily Goal: {dailyGoal} minutes ({Math.floor(dailyGoal / 60)}h {dailyGoal % 60}m)</label>
          <input type="range" min="30" max="480" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} className="settings-slider" />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveAccount} disabled={saving}>{saving ? 'Saving...' : 'Save Account'}</button>
        </div>
      </div>
    </div>
  )
}
