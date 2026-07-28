import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, tasks, sessions, achievements, loading, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [dailyGoal, setDailyGoal] = useState(120)
  const [saving, setSaving] = useState(false)

  if (loading || !profile) return <div className="prof-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp || 0)
  const totalMins = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedTasks = tasks.filter(t => t.completed).length
  const unlockedKeys = new Set(achievements.map(a => a.key))
  const recentAch = ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).slice(0, 8)

  const startEdit = () => { setUsername(profile.username || ''); setAvatar(profile.avatar_emoji || AVATAR_OPTIONS[0]); setDailyGoal(profile.daily_goal_minutes || 120); setEditing(true) }

  const save = async () => {
    setSaving(true)
    await updateProfile({ username, avatar_emoji: avatar, daily_goal_minutes: dailyGoal })
    setEditing(false); setSaving(false)
  }

  return (
    <div className="profile-page">
      <div className="prof-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="prof-banner-main">
          <span className="prof-avatar">{profile.avatar_emoji || '🦊'}</span>
          <div className="prof-info">
            <h1>{profile.username || 'Student'}</h1>
            <span className="prof-level-badge">Level {level}</span>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm prof-edit" style={{ color: '#fff' }} onClick={() => editing ? setEditing(false) : startEdit()}>{editing ? 'Cancel' : '✏️ Edit'}</button>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-head"><h3>Edit Profile</h3></div>
          <div className="form-field"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} placeholder="Your name" /></div>
          <div className="form-field"><label>Avatar</label>
            <div className="avatar-picker">{AVATAR_OPTIONS.map(a => (
              <button key={a} className={`avatar-swatch ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
            ))}</div>
          </div>
          <div className="form-field"><label>Daily goal: {dailyGoal} min</label>
            <input type="range" min="30" max="480" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} className="prof-slider" />
          </div>
          <div className="form-actions"><button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></div>
        </div>
      )}

      <div className="card prof-xp-card">
        <div className="card-head"><h3>Level {level}</h3><span className="prof-xp-total">{profile.xp || 0} XP</span></div>
        <div className="prof-xp-bar-track"><div className="prof-xp-bar-fill" style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
        <div className="prof-xp-detail">{currentLevelXp} / {nextLevelXp} XP to level {level + 1}</div>
      </div>

      <div className="grid-4 prof-stats">
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div><div className="an-stat-val">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div><div className="an-stat-label">Total time</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div><div className="an-stat-val">{completedTasks}</div><div className="an-stat-label">Tasks done</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</div><div className="an-stat-val">{sessions.length}</div><div className="an-stat-label">Sessions</div></div>
        <div className="card an-stat"><div className="an-stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>🏆</div><div className="an-stat-val">{achievements.length}</div><div className="an-stat-label">Achievements</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAch.length === 0 ? <div className="dash-empty">No achievements unlocked yet.</div> : (
          <div className="prof-ach-list">
            {recentAch.map(a => (
              <div key={a.key} className="prof-ach-item">
                <span className="prof-ach-icon">{a.icon}</span>
                <div><strong>{a.title}</strong><p>{a.desc}</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
