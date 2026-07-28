import { useState } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { THEMES, AVATAR_OPTIONS } from '../lib/helpers.js';
import './SettingsPage.css';

export default function Settings() {
  const { profile, settings, updateSettings, updateProfile } = useApp();
  const [local, setLocal] = useState({
    theme: settings?.theme || THEMES[0]?.name,
    primaryColor: settings?.primaryColor || '#6366f1',
    accentColor: settings?.accentColor || '#8b5cf6',
    font: settings?.font || 'Inter',
    radius: settings?.radius ?? 12,
    animations: settings?.animations ?? true,
  });
  const [acct, setAcct] = useState({ username: profile?.username || '', daily_goal_minutes: profile?.daily_goal_minutes || 120 });

  const saveAppearance = async () => { await updateSettings(local); };
  const saveAccount = async () => { await updateProfile({ username: acct.username, daily_goal_minutes: Number(acct.daily_goal_minutes) }); };

  return (
    <div className="settings-page">
      <div className="page-toolbar"><div><h2>Settings</h2><p className="page-desc">Customize your experience</p></div></div>

      <div className="card">
        <div className="card-head"><h3>Theme</h3></div>
        <div className="theme-grid">
          {THEMES.map(t => (
            <button key={t.name} className={`theme-card ${local.theme === t.name ? 'active' : ''}`} onClick={() => setLocal(s => ({ ...s, theme: t.name }))}>
              <div className="theme-preview" style={{ background: t.preview || `linear-gradient(135deg, ${t.primary}, ${t.accent})` }} />
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Colors</h3></div>
        <div className="form-row">
          <div className="form-field">
            <label>Primary</label>
            <div className="color-row">
              <div className="color-picker">
                {['#6366f1','#3b82f6','#22c55e','#ef4444','#f59e0b','#ec4899','#8b5cf6','#14b8a6'].map(c => (
                  <button key={c} className={`color-swatch ${local.primaryColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setLocal(s => ({ ...s, primaryColor: c }))} />
                ))}
              </div>
              <input type="color" value={local.primaryColor} onChange={e => setLocal(s => ({ ...s, primaryColor: e.target.value }))} />
            </div>
          </div>
          <div className="form-field">
            <label>Accent</label>
            <div className="color-row">
              <div className="color-picker">
                {['#8b5cf6','#06b6d4','#10b981','#f43f5e','#f97316','#d946ef','#6366f1','#0ea5e9'].map(c => (
                  <button key={c} className={`color-swatch ${local.accentColor === c ? 'active' : ''}`} style={{ background: c }} onClick={() => setLocal(s => ({ ...s, accentColor: c }))} />
                ))}
              </div>
              <input type="color" value={local.accentColor} onChange={e => setLocal(s => ({ ...s, accentColor: e.target.value }))} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Appearance</h3></div>
        <div className="form-row">
          <div className="form-field">
            <label>Font</label>
            <select value={local.font} onChange={e => setLocal(s => ({ ...s, font: e.target.value }))}>
              {['Inter','Roboto','Poppins','Georgia','Courier New','System UI'].map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Border Radius: {local.radius}px</label>
            <input type="range" min="0" max="24" value={local.radius} onChange={e => setLocal(s => ({ ...s, radius: Number(e.target.value) }))} />
          </div>
          <div className="form-field">
            <label>Animations</label>
            <label className="toggle"><input type="checkbox" checked={local.animations} onChange={e => setLocal(s => ({ ...s, animations: e.target.checked }))} /><span className="toggle-input" /><span className="toggle-track" /></label>
          </div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={saveAppearance}>Save Appearance</button></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Account</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Username</label><input type="text" value={acct.username} onChange={e => setAcct(a => ({ ...a, username: e.target.value }))} /></div>
          <div className="form-field"><label>Daily Goal (min)</label><input type="number" value={acct.daily_goal_minutes} onChange={e => setAcct(a => ({ ...a, daily_goal_minutes: e.target.value }))} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={saveAccount}>Save Account</button></div>
      </div>
    </div>
  );
}
