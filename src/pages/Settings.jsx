import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, SUBJECT_COLORS } from '../lib/helpers.js'
import './SettingsPage.css'

export default function Settings() {
  const { settings, profile, updateSettings, updateProfile, loading } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)
  const [savingAccount, setSavingAccount] = useState(false)

  const theme = settings?.theme || 'default'
  const primaryColor = settings?.primary_color || '#4f7cff'
  const accentColor = settings?.accent_color || '#ec4899'
  const fontFamily = settings?.font_family || 'Inter'
  const borderRadius = settings?.border_radius || 12
  const animations = settings?.animations !== false

  const saveAccount = async () => {
    setSavingAccount(true)
    await updateProfile({ username, daily_goal_minutes: dailyGoal })
    setSavingAccount(false)
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="settings-page">
      <div className="page-toolbar"><div><h2>Settings</h2><p className="page-desc">Customize your StudySpace experience.</p></div></div>

      <div className="card">
        <div className="card-head"><h3>🎨 Theme</h3></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`theme-card ${theme === key ? 'selected' : ''}`} onClick={() => updateSettings({ theme: key })}>
              <div className="theme-preview" style={{ background: t.bg }}>
                <div className="tp-sidebar" style={{ background: t.sidebar }} />
                <div className="tp-main">
                  <div className="tp-card" style={{ background: t.surface, borderColor: t.border }} />
                  <div className="tp-card" style={{ background: t.surface, borderColor: t.border }} />
                </div>
              </div>
              <span className="theme-name">{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Primary Color</h3></div>
          <div className="color-picker">
            {SUBJECT_COLORS.map(c => <button key={c} className={`color-swatch ${primaryColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ primary_color: c })} />)}
          </div>
          <div className="custom-color-row"><label>Custom</label><input type="color" value={primaryColor} onChange={e => updateSettings({ primary_color: e.target.value })} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Accent Color</h3></div>
          <div className="color-picker">
            {SUBJECT_COLORS.map(c => <button key={c} className={`color-swatch ${accentColor === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => updateSettings({ accent_color: c })} />)}
          </div>
          <div className="custom-color-row"><label>Custom</label><input type="color" value={accentColor} onChange={e => updateSettings({ accent_color: e.target.value })} /></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Appearance</h3></div>
        <div className="form-field"><label>Font Family</label><select value={fontFamily} onChange={e => updateSettings({ font_family: e.target.value })}><option value="Inter">Inter (Default)</option><option value="system-ui">System UI</option><option value="Georgia">Georgia</option><option value="monospace">Monospace</option><option value="Roboto">Roboto</option></select></div>
        <div className="form-field"><label>Border Radius: {borderRadius}px</label><input type="range" min="0" max="24" value={borderRadius} onChange={e => updateSettings({ border_radius: parseInt(e.target.value) })} className="radius-slider" /></div>
        <div className="setting-toggle"><span>Animations</span><button className={`toggle-switch ${animations ? 'on' : ''}`} onClick={() => updateSettings({ animations: !animations })}><span className="toggle-knob" /></button></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field"><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} /></div>
        <div className="form-field"><label>Daily Goal (minutes)</label><input type="number" min="30" max="600" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 120)} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={saveAccount} disabled={savingAccount}>{savingAccount ? 'Saving...' : 'Save Account'}</button></div>
      </div>
    </div>
  )
}
