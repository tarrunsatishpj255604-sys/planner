import { useApp } from '../lib/AppContext.jsx'
import { THEMES } from '../lib/helpers.js'
import { supabase } from '../lib/supabaseClient.js'
import './SettingsPage.css'

const THEME_LIST = Object.entries(THEMES)
const FONTS = ['Inter', 'Poppins', 'Roboto', 'JetBrains Mono', 'Georgia']
const COLOR_PRESETS = ['#4f7cff', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#ef4444', '#14b8a6']

export default function Settings() {
  const { settings, updateSettings, profile, updateProfile } = useApp()

  if (!settings) return null

  const handleTheme = (theme) => updateSettings({ theme })
  const handleColor = (key, color) => updateSettings({ [key]: color })
  const handleRadius = (val) => updateSettings({ border_radius: parseInt(val) })
  const handleFont = (font) => updateSettings({ font })
  const handleAnimations = (val) => updateSettings({ animations_enabled: val })

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <p className="page-desc">Customize your StudySpace. Pick a theme, change colors, and fine-tune the look.</p>
      </div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {THEME_LIST.map(([key, theme]) => (
            <button
              key={key}
              className={`theme-card ${settings.theme === key ? 'active' : ''}`}
              onClick={() => handleTheme(key)}
              style={{ background: theme.bg, border: settings.theme === key ? '2px solid var(--primary)' : `1px solid ${theme.border}` }}
            >
              <div className="theme-preview" style={{ background: theme.surface }}>
                <div className="tp-bar" style={{ background: theme.sidebar }} />
                <div className="tp-content">
                  <div className="tp-line" style={{ background: theme.text, opacity: 0.7 }} />
                  <div className="tp-line short" style={{ background: theme.text2 }} />
                  <div className="tp-dot" style={{ background: settings.primary_color }} />
                </div>
              </div>
              <span className="theme-name" style={{ color: theme.text }}>{theme.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Custom Colors</h3></div>
        <div className="settings-row">
          <div className="form-field">
            <label>Primary color</label>
            <div className="color-row">
              {COLOR_PRESETS.map(c => (
                <button key={c} className={`color-swatch ${settings.primary_color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => handleColor('primary_color', c)} />
              ))}
              <input type="color" value={settings.primary_color} onChange={e => handleColor('primary_color', e.target.value)} className="color-input" />
            </div>
          </div>
          <div className="form-field">
            <label>Accent color</label>
            <div className="color-row">
              {COLOR_PRESETS.map(c => (
                <button key={c} className={`color-swatch ${settings.accent_color === c ? 'selected' : ''}`} style={{ background: c }} onClick={() => handleColor('accent_color', c)} />
              ))}
              <input type="color" value={settings.accent_color} onChange={e => handleColor('accent_color', e.target.value)} className="color-input" />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Appearance</h3></div>
        <div className="settings-row">
          <div className="form-field">
            <label>Font</label>
            <select value={settings.font} onChange={e => handleFont(e.target.value)}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Border radius ({settings.border_radius}px)</label>
            <input type="range" min="0" max="24" value={settings.border_radius} onChange={e => handleRadius(e.target.value)} className="settings-slider" />
          </div>
        </div>
        <div className="settings-toggle-row">
          <span>Enable animations</span>
          <button className={`toggle-switch ${settings.animations_enabled ? 'on' : ''}`} onClick={() => handleAnimations(!settings.animations_enabled)}>
            <span className="toggle-knob" />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="settings-row">
          <div className="form-field">
            <label>Username</label>
            <input type="text" value={profile?.username || ''} onChange={e => updateProfile({ username: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Daily goal (minutes)</label>
            <input type="number" value={profile?.daily_goal_minutes || 120} onChange={e => updateProfile({ daily_goal_minutes: parseInt(e.target.value) || 120 })} min="15" max="600" />
          </div>
        </div>
      </div>
    </div>
  )
}
