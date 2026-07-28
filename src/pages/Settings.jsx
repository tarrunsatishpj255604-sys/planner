import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, AVATAR_OPTIONS } from '../lib/helpers.js'
import './SettingsPage.css'

export default function Settings() {
  const { settings, profile, updateSettings, updateProfile } = useApp()
  const [username, setUsername] = useState(profile?.username || '')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)

  const currentTheme = settings?.theme || 'default'
  const primary = settings?.primary_color || '#4f7cff'
  const accent = settings?.accent_color || '#ec4899'
  const font = settings?.font || 'Inter'
  const radius = settings?.border_radius ?? 12
  const animations = settings?.animations ?? true

  const setTheme = (key) => updateSettings({ theme: key })
  const setPrimary = (c) => updateSettings({ primary_color: c })
  const setAccent = (c) => updateSettings({ accent_color: c })
  const setFontVal = (f) => updateSettings({ font: f })
  const setRadius = (r) => updateSettings({ border_radius: r })
  const setAnimations = (a) => updateSettings({ animations: a })

  const saveAccount = () => {
    updateProfile({ username, daily_goal_minutes: dailyGoal })
  }

  const colorSwatches = ['#4f7cff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6', '#f97316', '#6366f1']
  const fontOptions = ['Inter', 'Poppins', 'Roboto', 'Lora', 'JetBrains Mono', 'Georgia']

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div><h2>Settings</h2><p className="page-desc">Customize your study app experience.</p></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {Object.entries(THEMES).map(([key, t]) => (
            <button key={key} className={`theme-card ${currentTheme === key ? 'selected' : ''}`} onClick={() => setTheme(key)}>
              <div className="theme-preview" style={{ background: t.bg }}>
                <div className="tp-sidebar" style={{ background: t.sidebar }} />
                <div className="tp-main">
                  <div className="tp-bar" style={{ background: t.surface }} />
                  <div className="tp-bar short" style={{ background: t.surface }} />
                  <div className="tp-accent" style={{ background: primary }} />
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
            {colorSwatches.map(c => (
              <button key={c} className={`color-swatch ${primary === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setPrimary(c)} />
            ))}
          </div>
          <div className="color-input-row">
            <input type="color" value={primary} onChange={(e) => setPrimary(e.target.value)} className="color-input" />
            <span className="color-hex">{primary}</span>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>Accent Color</h3></div>
          <div className="color-picker">
            {colorSwatches.map(c => (
              <button key={c} className={`color-swatch ${accent === c ? 'selected' : ''}`} style={{ background: c, color: c }} onClick={() => setAccent(c)} />
            ))}
          </div>
          <div className="color-input-row">
            <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="color-input" />
            <span className="color-hex">{accent}</span>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Font</h3></div>
          <select className="settings-select" value={font} onChange={(e) => setFontVal(e.target.value)}>
            {fontOptions.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
          </select>
        </div>

        <div className="card">
          <div className="card-head"><h3>Border Radius</h3></div>
          <div className="slider-row">
            <input type="range" min={0} max={24} value={radius} onChange={(e) => setRadius(parseInt(e.target.value))} className="settings-slider" />
            <span className="slider-val">{radius}px</span>
          </div>
          <div className="radius-preview" style={{ borderRadius: radius }}>Preview</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Animations</h3></div>
        <label className="toggle-row">
          <span>Enable animations and transitions</span>
          <button className={`toggle-switch ${animations ? 'on' : ''}`} onClick={() => setAnimations(!animations)}>
            <span className="toggle-knob" />
          </button>
        </label>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-field">
          <label>Username</label>
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </div>
        <div className="form-field">
          <label>Daily Goal (minutes)</label>
          <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value) || 120)} min={15} max={600} />
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={saveAccount}>Save Account</button>
        </div>
      </div>
    </div>
  )
}
