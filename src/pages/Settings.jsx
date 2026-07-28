import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, SUBJECT_COLORS } from '../lib/helpers.js'
import './SettingsPage.css'

export default function Settings() {
  const { settings, profile, updateSettings, updateProfile } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)
  const [busy, setBusy] = useState(false)

  if (!settings) return <div className="spinner" />

  const setTheme = (key) => updateSettings({ theme: key })
  const setPrimary = (c) => updateSettings({ primary_color: c })
  const setAccent = (c) => updateSettings({ accent_color: c })
  const setFont = (f) => updateSettings({ font_family: f })
  const setRadius = (r) => updateSettings({ border_radius: r })
  const toggleAnim = () => updateSettings({ animations_enabled: !settings.animations_enabled })

  const saveAccount = async () => {
    if (busy) return
    setBusy(true)
    await updateProfile({ username: username.trim() || 'Student', daily_goal_minutes: Number(dailyGoal) })
    setBusy(false)
  }

  const fonts = [
    { key: 'Inter', label: 'Inter (Default)' },
    { key: 'system-ui', label: 'System UI' },
    { key: 'Georgia', label: 'Georgia' },
    { key: 'Courier New', label: 'Courier' },
    { key: 'Arial', label: 'Arial' },
  ]

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div>
          <h2>Settings</h2>
          <p className="page-desc">Customize the look and feel of your study planner.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="settings-theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`settings-theme-card ${settings.theme === key ? 'selected' : ''}`} onClick={() => setTheme(key)}>
              <div className="settings-theme-preview" style={{ background: t.bg }}>
                <div className="stp-sidebar" style={{ background: t.sidebar }} />
                <div className="stp-main">
                  <div className="stp-bar" style={{ background: t.surface, borderColor: t.border }} />
                  <div className="stp-bar short" style={{ background: t.surface, borderColor: t.border }} />
                  <div className="stp-accent" style={{ background: settings.primary_color || '#4f7cff' }} />
                </div>
              </div>
              <span className="settings-theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Primary Color</h3></div>
          <div className="color-picker">
            {SUBJECT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${(settings.primary_color || '#4f7cff') === c ? 'selected' : ''}`}
                style={{ background: c, color: c }} onClick={() => setPrimary(c)} />
            ))}
          </div>
          <div className="settings-color-input-row">
            <label>Custom:</label>
            <input type="color" value={settings.primary_color || '#4f7cff'} onChange={(e) => setPrimary(e.target.value)} />
            <span className="settings-color-hex">{settings.primary_color || '#4f7cff'}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Accent Color</h3></div>
          <div className="color-picker">
            {SUBJECT_COLORS.map(c => (
              <button key={c} className={`color-swatch ${(settings.accent_color || '#ec4899') === c ? 'selected' : ''}`}
                style={{ background: c, color: c }} onClick={() => setAccent(c)} />
            ))}
          </div>
          <div className="settings-color-input-row">
            <label>Custom:</label>
            <input type="color" value={settings.accent_color || '#ec4899'} onChange={(e) => setAccent(e.target.value)} />
            <span className="settings-color-hex">{settings.accent_color || '#ec4899'}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Font</h3></div>
          <select className="settings-font-select" value={settings.font_family || 'Inter'} onChange={(e) => setFont(e.target.value)}>
            {fonts.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="card-head"><h3>Border Radius</h3></div>
          <div className="settings-slider-row">
            <input type="range" min="0" max="24" value={settings.border_radius || 12} onChange={(e) => setRadius(Number(e.target.value))} />
            <span className="settings-slider-val">{settings.border_radius || 12}px</span>
          </div>
          <div className="settings-radius-preview" style={{ borderRadius: settings.border_radius || 12 }}>Preview</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Animations</h3></div>
        <label className="settings-toggle">
          <input type="checkbox" checked={settings.animations_enabled !== false} onChange={toggleAnim} />
          <span className="settings-toggle-track"><span className="settings-toggle-thumb" /></span>
          <span>Enable animations and transitions</span>
        </label>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" />
        </div>
        <div className="form-field">
          <label>Daily goal (minutes)</label>
          <input type="number" min="15" max="600" step="15" value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveAccount} disabled={busy}>Save Account</button>
        </div>
      </div>
    </div>
  )
}
