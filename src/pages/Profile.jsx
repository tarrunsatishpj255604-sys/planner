import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, sessions, tasks, achievements, loading, refresh, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile?.xp || 0)
  const streak = getStreak(sessions)
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedTasks = tasks.filter(t => t.completed).length

  const startEdit = () => {
    setUsername(profile?.username || '')
    setAvatar(profile?.avatar_emoji || AVATAR_OPTIONS[0])
    setEditing(true)
  }

  const save = async () => {
    if (saving || !username.trim()) return
    setSaving(true)
    await updateProfile({ username: username.trim(), avatar_emoji: avatar })
    setEditing(false)
    refresh()
    setSaving(false)
  }

  const unlockedKeys = new Set(achievements.map(a => a.key))
  const recentAchievements = ACHIEVEMENT_DEFS.filter(def => unlockedKeys.has(def.key)).slice(0, 6)

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="profile-banner-content">
          <span className="profile-avatar" style={{ fontSize: 64 }}>{profile?.avatar_emoji || '🦊'}</span>
          <div className="profile-info">
            <h1 className="profile-username">{profile?.username || 'Student'}</h1>
            <div className="profile-level-badge">Level {level}</div>
            <p className="profile-xp-text">{profile?.xp || 0} XP</p>
          </div>
          <button className="btn btn-sm profile-edit-btn" onClick={startEdit}>✏️ Edit Profile</button>
        </div>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-head"><h3>Edit Profile</h3></div>
          <div className="form-field"><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} /></div>
          <div className="form-field"><label>Avatar</label>
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map(a => (
                <button key={a} className={`avatar-pick ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="form-field"><label>Daily Goal (minutes): {profile?.daily_goal || 120}</label>
            <input type="range" min="30" max="480" step="15" value={profile?.daily_goal || 120} onChange={e => updateProfile({ daily_goal: parseInt(e.target.value) })} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={saving || !username.trim()}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </div>
      )}

      <div className="card xp-card">
        <div className="card-head"><h3>Level {level}</h3><span className="xp-total">{profile?.xp || 0} XP</span></div>
        <div className="xp-progress-wrap">
          <div className="xp-progress-bar"><div className="xp-progress-fill" style={{ width: `${progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
          <div className="xp-progress-text">{currentLevelXp} / {nextLevelXp} XP</div>
        </div>
        <p className="xp-hint">{nextLevelXp - currentLevelXp} XP to level {level + 1}</p>
      </div>

      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-info"><span className="stat-value">{Math.floor(totalMinutes / 60)}h</span><span className="stat-label">Total Study</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>🔥</div>
          <div className="stat-info"><span className="stat-value">{streak}</span><span className="stat-label">Day Streak</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>✅</div>
          <div className="stat-info"><span className="stat-value">{completedTasks}</span><span className="stat-label">Tasks Done</span></div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'var(--error-l)', color: 'var(--error)' }}>🏆</div>
          <div className="stat-info"><span className="stat-value">{achievements.length}</span><span className="stat-label">Achievements</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAchievements.length === 0 ? <div className="dash-empty">No achievements unlocked yet. Keep studying!</div> : (
          <div className="recent-achievements">
            {recentAchievements.map(def => (
              <div key={def.key} className="recent-ach-item">
                <span className="recent-ach-icon">{def.icon}</span>
                <div><span className="recent-ach-title">{def.title}</span><span className="recent-ach-desc">{def.desc}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
