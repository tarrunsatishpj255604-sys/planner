import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, SUBJECT_COLORS } from '../lib/helpers.js'
import './SettingsPage.css'

export default function Settings() {
  const { settings, profile, updateSettings, updateProfile } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)

  if (!settings) return null

  const fonts = ['Inter', 'Poppins', 'Roboto', 'JetBrains Mono', 'Playfair Display']

  const saveAccount = () => { updateProfile({ username, daily_goal_minutes: dailyGoal }) }

  return (
    <div className="settings-page">
      <div className="page-toolbar"><div><h2>Settings</h2><p className="page-desc">Customize your experience</p></div></div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, theme]) => (
            <button key={key} className={`theme-card ${settings.theme === key ? 'selected' : ''}`} onClick={() => updateSettings({ theme: key })}>
              <div className="theme-preview" style={{ background: theme.bg }}>
                <div className="tp-bar" style={{ background: theme.surface, borderColor: theme.border }} />
                <div className="tp-dot" style={{ background: theme.text }} />
                <div className="tp-dot" style={{ background: theme.text2 }} />
                <div className="tp-dot" style={{ background: theme.border }} />
              </div>
              <span className="theme-name">{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Colors</h3></div>
        <div className="color-section">
          <label>Primary Color</label>
          <div className="color-row">
            <div className="color-swatches">{SUBJECT_COLORS.map(c => <div key={c} className={`color-swatch ${(settings.primary_color || '#4f7cff') === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ primary_color: c })} />)}</div>
            <input type="color" value={settings.primary_color || '#4f7cff'} onChange={e => updateSettings({ primary_color: e.target.value })} />
          </div>
        </div>
        <div className="color-section">
          <label>Accent Color</label>
          <div className="color-row">
            <div className="color-swatches">{SUBJECT_COLORS.map(c => <div key={c} className={`color-swatch ${(settings.accent_color || '#ec4899') === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ accent_color: c })} />)}</div>
            <input type="color" value={settings.accent_color || '#ec4899'} onChange={e => updateSettings({ accent_color: e.target.value })} />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Appearance</h3></div>
        <div className="form-field"><label>Font</label><select value={settings.font || 'Inter'} onChange={e => updateSettings({ font: e.target.value })}>{fonts.map(f => <option key={f} value={f}>{f}</option>)}</select></div>
        <div className="form-field"><label>Border Radius: {settings.border_radius || 12}px</label><input type="range" min="4" max="24" value={settings.border_radius || 12} onChange={e => updateSettings({ border_radius: parseInt(e.target.value) })} /></div>
        <div className="form-field"><label>Animations</label><label className="switch"><input type="checkbox" checked={settings.animations_enabled !== false} onChange={e => updateSettings({ animations_enabled: e.target.checked })} /><span className="slider" /></label></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} /></div>
        <div className="form-field"><label>Daily Goal: {dailyGoal} minutes</label><input type="range" min="30" max="480" step="30" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={saveAccount}>Save Account</button></div>
      </div>
    </div>
  )
}
