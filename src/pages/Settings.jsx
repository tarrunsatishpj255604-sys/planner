import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, AVATAR_OPTIONS, SUBJECT_COLORS } from '../lib/helpers.js'
import './SettingsPage.css'

export default function Settings() {
  const { user, profile, settings, updateSettings, updateProfile } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || AVATAR_OPTIONS[0])
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 120)
  const [saved, setSaved] = useState(false)

  const currentTheme = settings?.theme || 'default'
  const primaryColor = settings?.primary_color || '#4f7cff'
  const accentColor = settings?.accent_color || '#ec4899'
  const font = settings?.font || 'Inter'
  const borderRadius = settings?.border_radius || 12
  const animations = settings?.animations !== false

  const saveAccount = async () => {
    await updateProfile({ username: username.trim() || 'Student', avatar_emoji: avatar, daily_goal: Number(dailyGoal) || 120 })
    setSaved(true); setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div>
          <h2>Settings</h2>
          <p className="page-desc">Customize your StudySpace experience with themes, colors, and preferences.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`theme-card ${currentTheme === key ? 'active' : ''}`} onClick={() => updateSettings({ theme: key })}>
              <div className="theme-preview" style={{ background: t.bg }}>
                <div className="tp-surface" style={{ background: t.surface, borderColor: t.border }} />
                <div className="tp-accent" style={{ background: t.dark ? '#4f7cff' : primaryColor }} />
              </div>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Custom Colors</h3></div>
        <div className="form-row">
          <div className="form-field">
            <label>Primary Color</label>
            <div className="color-row">
              <input type="color" value={primaryColor} onChange={e => updateSettings({ primary_color: e.target.value })} className="color-input" />
              <div className="color-swatches">
                {SUBJECT_COLORS.map(c => <div key={c} className={`color-swatch ${primaryColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ primary_color: c })} />)}
              </div>
            </div>
          </div>
          <div className="form-field">
            <label>Accent Color</label>
            <div className="color-row">
              <input type="color" value={accentColor} onChange={e => updateSettings({ accent_color: e.target.value })} className="color-input" />
              <div className="color-swatches">
                {SUBJECT_COLORS.map(c => <div key={c} className={`color-swatch ${accentColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ accent_color: c })} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Appearance</h3></div>
        <div className="form-row">
          <div className="form-field">
            <label>Font</label>
            <select value={font} onChange={e => updateSettings({ font: e.target.value })}>
              <option value="Inter">Inter (Default)</option>
              <option value="system-ui">System UI</option>
              <option value="Georgia">Georgia</option>
              <option value="monospace">Monospace</option>
              <option value="Arial">Arial</option>
            </select>
          </div>
          <div className="form-field">
            <label>Border Radius: {borderRadius}px</label>
            <input type="range" min="0" max="24" value={borderRadius} onChange={e => updateSettings({ border_radius: Number(e.target.value) })} />
          </div>
        </div>
        <div className="form-field">
          <label>Animations</label>
          <button className={`toggle-switch ${animations ? 'on' : ''}`} onClick={() => updateSettings({ animations: !animations })}>
            <span className="toggle-knob" />
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
            {AVATAR_OPTIONS.map(a => <button key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>)}
          </div>
        </div>
        <div className="form-field">
          <label>Daily Goal (minutes): {dailyGoal}</label>
          <input type="range" min="30" max="480" step="30" value={dailyGoal} onChange={e => setDailyGoal(Number(e.target.value))} />
        </div>
        <div className="form-actions">
          {saved && <span className="settings-saved">✓ Saved!</span>}
          <button className="btn btn-primary" onClick={saveAccount}>Save Changes</button>
        </div>
      </div>
    </div>
  )
}
