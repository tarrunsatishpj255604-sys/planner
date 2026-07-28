import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, getStreak, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, subjects, sessions, tasks, achievements, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [dailyGoal, setDailyGoal] = useState(120)
  const [busy, setBusy] = useState(false)

  if (!profile) return <div className="spinner" />

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp || 0)
  const streak = getStreak(sessions)
  const totalMins = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const tasksDone = tasks.filter(t => t.completed).length
  const recentAch = ACHIEVEMENT_DEFS.filter(def => achievements.some(a => a.key === def.key)).slice(-6)

  const startEdit = () => {
    setUsername(profile.username || '')
    setAvatar(profile.avatar_emoji || AVATAR_OPTIONS[0])
    setDailyGoal(profile.daily_goal_minutes || 120)
    setEditing(true)
  }

  const save = async () => {
    if (busy) return
    setBusy(true)
    await updateProfile({ username: username.trim() || 'Student', avatar_emoji: avatar, daily_goal_minutes: Number(dailyGoal) })
    setBusy(false); setEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-banner">
        <div className="profile-banner-bg" />
        <div className="profile-banner-content">
          <span className="profile-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>{profile.avatar_emoji || '🦊'}</span>
          <div className="profile-banner-info">
            <h1>{profile.username || 'Student'}</h1>
            <span className="profile-level-badge">Level {level}</span>
          </div>
          <button className="btn btn-ghost profile-edit" style={{ color: '#fff' }} onClick={startEdit}>✏️ Edit</button>
        </div>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-head"><h3>Edit Profile</h3></div>
          <div className="form-field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Your name" />
          </div>
          <div className="form-field">
            <label>Avatar</label>
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map(a => (
                <button key={a} className={`avatar-swatch ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Daily goal (minutes)</label>
            <input type="number" min="15" max="600" step="15" value={dailyGoal} onChange={(e) => setDailyGoal(e.target.value)} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save} disabled={busy}>Save</button>
          </div>
        </div>
      )}

      <div className="card profile-xp-card">
        <div className="profile-xp-row">
          <span className="profile-xp-badge">Lv {level}</span>
          <div className="profile-xp-bar-wrap">
            <div className="profile-xp-bar" style={{ width: `${progress * 100}%` }} />
          </div>
          <span className="profile-xp-text">{currentLevelXp} / {nextLevelXp} XP</span>
        </div>
        <p className="profile-xp-hint">{nextLevelXp - currentLevelXp} XP until level {level + 1}</p>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fce7f3', color: '#ec4899' }}>🔥</div>
          <div className="stat-body"><span className="stat-value">{streak} days</span><span className="stat-label">Streak</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8efff', color: '#4f7cff' }}>⏱️</div>
          <div className="stat-body"><span className="stat-value">{Math.floor(totalMins / 60)}h</span><span className="stat-label">Total hours</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e8f9ee', color: '#22c55e' }}>✅</div>
          <div className="stat-body"><span className="stat-value">{tasksDone}</span><span className="stat-label">Tasks done</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef4e6', color: '#f59e0b' }}>📚</div>
          <div className="stat-body"><span className="stat-value">{subjects.length}</span><span className="stat-label">Subjects</span></div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAch.length === 0 ? (
          <p className="dash-empty">No achievements unlocked yet. Keep studying!</p>
        ) : (
          <div className="profile-ach-list">
            {recentAch.map(a => (
              <div key={a.key} className="profile-ach-item">
                <span className="profile-ach-icon">{a.icon}</span>
                <div className="profile-ach-info">
                  <span className="profile-ach-title">{a.title}</span>
                  <span className="profile-ach-desc">{a.desc}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
