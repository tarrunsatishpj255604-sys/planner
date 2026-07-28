import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, sessions, tasks, achievements, loading, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || '🦊')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>
  if (!profile) return <div className="empty-state"><h3>No profile found</h3></div>

  const xpInfo = levelFromXp(profile.xp || 0)
  const totalTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const tasksDone = tasks.filter(t => t.completed).length
  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = unlockedKeys.size
  const recentAchievements = achievements.slice(-8).reverse()

  const save = async () => {
    setSaving(true)
    await updateProfile({ username: username.trim(), avatar_emoji: avatar, daily_goal_minutes: dailyGoal })
    setEditing(false); setSaving(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="profile-banner-info">
          <span className="profile-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>{profile.avatar_emoji || '🦊'}</span>
          <div>
            <h2>{profile.username || 'Student'}</h2>
            <div className="profile-badge-row">
              <span className="profile-level-badge">⭐ Level {xpInfo.level}</span>
              <span className="profile-xp-badge">{profile.xp || 0} XP</span>
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm profile-edit-btn" style={{ color: '#fff' }} onClick={() => { setEditing(!editing); setUsername(profile.username || ''); setAvatar(profile.avatar_emoji || '🦊'); setDailyGoal(profile.daily_goal_minutes || 120) }}>{editing ? 'Cancel' : '✏️ Edit'}</button>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-head"><h3>Edit Profile</h3></div>
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
            <input type="range" min="30" max="480" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} className="profile-slider" />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      )}

      <div className="card profile-xp-card">
        <div className="card-head"><h3>XP & Level</h3></div>
        <div className="profile-xp-content">
          <div className="profile-xp-level-row">
            <span className="profile-xp-badge" style={{ background: 'var(--primary)' }}>{xpInfo.level}</span>
            <span className="profile-xp-text">Level {xpInfo.level}</span>
          </div>
          <div className="profile-xp-bar">
            <div className="profile-xp-fill" style={{ width: `${xpInfo.progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
          </div>
          <span className="profile-xp-detail">{xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP to Level {xpInfo.level + 1}</span>
        </div>
      </div>

      <div className="grid-4 profile-stats">
        <div className="card profile-stat"><span className="profile-stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</span><div><span className="profile-stat-val">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span><span className="profile-stat-label">total time</span></div></div>
        <div className="card profile-stat"><span className="profile-stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</span><div><span className="profile-stat-val">{tasksDone}</span><span className="profile-stat-label">tasks done</span></div></div>
        <div className="card profile-stat"><span className="profile-stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📚</span><div><span className="profile-stat-val">{sessions.length}</span><span className="profile-stat-label">sessions</span></div></div>
        <div className="card profile-stat"><span className="profile-stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>🏆</span><div><span className="profile-stat-val">{unlockedCount}</span><span className="profile-stat-label">achievements</span></div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAchievements.length === 0 ? <div className="dash-empty">No achievements unlocked yet. Start studying!</div> : (
          <div className="profile-ach-list">
            {recentAchievements.map((a, i) => {
              const def = ACHIEVEMENT_DEFS.find(d => d.key === a.key)
              return (
                <div key={a.id || i} className="profile-ach-item">
                  <span className="profile-ach-icon">{def?.icon || '🏅'}</span>
                  <div><strong>{def?.title || a.key}</strong><span>{def?.desc || ''}</span></div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
