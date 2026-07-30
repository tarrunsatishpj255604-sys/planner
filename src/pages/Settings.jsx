import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { THEMES, AVATAR_OPTIONS } from '../lib/helpers.js'
import './SettingsPage.css'

const FONTS = ['Inter', 'Poppins', 'Roboto', 'Georgia', 'Courier New', 'Comic Sans MS']

export default function Settings() {
  const { settings, profile, loading, updateSettings, updateProfile } = useApp()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const save = async () => {
    setSaving(true)
    setSaved(false)
    await updateSettings({})
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const themeKeys = Object.keys(THEMES)

  return (
    <div className="settings-page">
      <div className="page-toolbar">
        <div><h2>Settings</h2><p className="page-desc">Customize your StudySpace experience with themes, colors, and preferences.</p></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>🎨 Theme</h3></div>
        <div className="theme-grid">
          {themeKeys.map(key => {
            const t = THEMES[key]
            const isActive = settings?.theme === key
            return (
              <button key={key} className={`theme-card ${isActive ? 'active' : ''}`} onClick={() => updateSettings({ theme: key })}>
                <div className="theme-preview" style={{ background: t.bg }}>
                  <div className="tp-surface" style={{ background: t.surface, borderColor: t.border }} />
                  <div className="tp-bar" style={{ background: t.sidebar }} />
                  <div className="tp-accent" style={{ background: t.dark ? t.text2 : 'var(--primary)' }} />
                </div>
                <span className="theme-name" style={{ color: isActive ? 'var(--primary)' : 'var(--text)' }}>{t.name}</span>
                {isActive && <span className="theme-check">✓</span>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>🖌️ Custom Colors</h3></div>
          <div className="form-field">
            <label>Primary Color</label>
            <div className="color-input-row">
              <input type="color" value={settings?.primary_color || '#4f7cff'} onChange={e => updateSettings({ primary_color: e.target.value })} />
              <span className="color-hex">{settings?.primary_color || '#4f7cff'}</span>
            </div>
          </div>
          <div className="form-field">
            <label>Accent Color</label>
            <div className="color-input-row">
              <input type="color" value={settings?.accent_color || '#ec4899'} onChange={e => updateSettings({ accent_color: e.target.value })} />
              <span className="color-hex">{settings?.accent_color || '#ec4899'}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>🔤 Appearance</h3></div>
          <div className="form-field">
            <label>Font Family</label>
            <select value={settings?.font || 'Inter'} onChange={e => updateSettings({ font: e.target.value })}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Border Radius: {settings?.border_radius || 12}px</label>
            <input type="range" min="0" max="24" step="1" value={settings?.border_radius || 12} onChange={e => updateSettings({ border_radius: parseInt(e.target.value) })} />
          </div>
          <div className="form-field">
            <label>Animations</label>
            <div className="switch-row">
              <span>Enable transitions and animations</span>
              <button className={`switch ${settings?.animations !== false ? 'on' : ''}`} onClick={() => updateSettings({ animations: settings?.animations !== false ? false : true })}>
                <span className="switch-knob" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>👤 Account</h3></div>
        <div className="form-row">
          <div className="form-field">
            <label>Username</label>
            <input type="text" value={profile?.username || ''} onChange={e => updateProfile({ username: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Avatar</label>
            <select value={profile?.avatar_emoji || ''} onChange={e => updateProfile({ avatar_emoji: e.target.value })}>
              {AVATAR_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
        <div className="form-field">
          <label>Daily Goal: {profile?.daily_goal || 120} minutes</label>
          <input type="range" min="30" max="480" step="15" value={profile?.daily_goal || 120} onChange={e => updateProfile({ daily_goal: parseInt(e.target.value) })} />
        </div>
      </div>

      <div className="settings-save-bar">
        {saved && <span className="save-confirm">✓ Settings saved</span>}
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Settings'}</button>
      </div>
    </div>
  )
}
