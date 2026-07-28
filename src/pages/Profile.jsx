import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { levelFromXp, getStreak, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { user, profile, sessions, tasks, achievements, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || AVATAR_OPTIONS[0])
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal || 120)

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile?.xp || 0)
  const streak = getStreak(sessions)
  const totalTime = sessions.reduce((a, s) => a + (s.duration || 0), 0)
  const tasksDone = tasks.filter(t => t.completed).length
  const unlockedKeys = new Set(achievements.map(a => a.key))
  const recentAchievements = ACHIEVEMENT_DEFS.filter(a => unlockedKeys.has(a.key)).slice(0, 6)

  const save = async () => {
    await updateProfile({ username: username.trim() || 'Student', avatar_emoji: avatar, daily_goal: Number(dailyGoal) || 120 })
    setEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}>
        <div className="profile-avatar">{profile?.avatar_emoji || '🦊'}</div>
        <div className="profile-banner-info">
          <h1>{profile?.username || 'Student'}</h1>
          <span className="profile-level-badge">Level {level}</span>
        </div>
        <button className="btn btn-sm profile-edit-btn" onClick={() => setEditing(!editing)}>{editing ? 'Cancel' : '✏️ Edit'}</button>
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
              {AVATAR_OPTIONS.map(a => <button key={a} className={`avatar-option ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>)}
            </div>
          </div>
          <div className="form-field">
            <label>Daily Goal (minutes): {dailyGoal}</label>
            <input type="range" min="30" max="480" step="30" value={dailyGoal} onChange={e => setDailyGoal(Number(e.target.value))} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      )}

      <div className="card profile-xp-card">
        <div className="card-head"><h3>Level Progress</h3></div>
        <div className="profile-xp-row">
          <span className="profile-xp-level" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>Lvl {level}</span>
          <div className="profile-xp-info">
            <span className="profile-xp-current">{currentLevelXp} / {nextLevelXp} XP</span>
            <span className="profile-xp-next">{Math.round(nextLevelXp - currentLevelXp)} XP to level {level + 1}</span>
          </div>
        </div>
        <div className="profile-xp-bar"><div className="profile-xp-fill" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} /></div>
      </div>

      <div className="grid-4">
        <div className="card profile-stat-card">
          <div className="ps-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <span className="ps-val">{Math.round(totalTime / 60 * 10) / 10}h</span>
          <span className="ps-label">Total Studied</span>
        </div>
        <div className="card profile-stat-card">
          <div className="ps-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>🔥</div>
          <span className="ps-val">{streak}</span>
          <span className="ps-label">Day Streak</span>
        </div>
        <div className="card profile-stat-card">
          <div className="ps-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <span className="ps-val">{tasksDone}</span>
          <span className="ps-label">Tasks Done</span>
        </div>
        <div className="card profile-stat-card">
          <div className="ps-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>🏆</div>
          <span className="ps-val">{achievements.length}</span>
          <span className="ps-label">Achievements</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAchievements.length === 0 ? <p className="dash-empty">No achievements unlocked yet.</p> : (
          <div className="profile-achievements">
            {recentAchievements.map(a => (
              <div key={a.key} className="profile-achievement">
                <span className="pa-icon">{a.icon}</span>
                <div><span className="pa-title">{a.title}</span><span className="pa-desc">{a.desc}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
