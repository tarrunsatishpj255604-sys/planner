import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, AVATAR_OPTIONS } from '../lib/helpers.js'
import { supabase } from '../lib/supabaseClient.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, sessions, tasks, achievements, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar || AVATAR_OPTIONS[0])
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)

  const levelInfo = levelFromXp(profile?.xp || 0)
  const totalMins = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const tasksDone = tasks.filter(t => t.completed).length
  const recentAchievements = achievements.slice(-5).reverse()

  const save = () => {
    updateProfile({ username, avatar, daily_goal_minutes: dailyGoal })
    setEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-banner">
        <div className="profile-avatar">{profile?.avatar || '🦊'}</div>
        <div className="profile-banner-info">
          <h1>{profile?.username || 'Student'}</h1>
          <div className="profile-level-badge">⭐ Level {levelInfo.level}</div>
        </div>
        <button className="btn btn-outline" onClick={() => { setEditing(!editing); setUsername(profile?.username || ''); setAvatar(profile?.avatar || AVATAR_OPTIONS[0]); setDailyGoal(profile?.daily_goal_minutes || 120) }}>
          {editing ? 'Cancel' : '✏️ Edit Profile'}
        </button>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-field">
            <label>Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Avatar</label>
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map(a => (
                <button key={a} type="button" className={`avatar-pick ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Daily Goal (minutes)</label>
            <input type="number" value={dailyGoal} onChange={(e) => setDailyGoal(parseInt(e.target.value) || 120)} min={15} max={600} />
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={save}>Save</button>
          </div>
        </div>
      )}

      <div className="card xp-card">
        <div className="card-head"><h3>Level Progress</h3></div>
        <div className="xp-level-row">
          <div className="xp-level-badge">Lv {levelInfo.level}</div>
          <div className="xp-level-info">
            <div className="xp-progress-track"><div className="xp-progress-fill" style={{ width: `${levelInfo.progress * 100}%` }} /></div>
            <div className="xp-progress-text">{levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP to Level {levelInfo.level + 1}</div>
          </div>
        </div>
      </div>

      <div className="grid-4 stat-cards">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div>
          <div className="stat-value">{Math.floor(totalMins / 60)}h</div>
          <div className="stat-label">Total Study</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div>
          <div className="stat-value">{tasksDone}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>🏆</div>
          <div className="stat-value">{achievements.length}</div>
          <div className="stat-label">Achievements</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⚡</div>
          <div className="stat-value">{profile?.xp || 0}</div>
          <div className="stat-label">Total XP</div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAchievements.length === 0 ? <div className="dash-empty">No achievements unlocked yet.</div> : (
          <div className="achievement-list">
            {recentAchievements.map(a => (
              <div key={a.id} className="achievement-item">
                <span className="achievement-icon">🏆</span>
                <div className="achievement-info">
                  <div className="achievement-title">{a.key.replace(/_/g, ' ')}</div>
                  <div className="achievement-desc">Unlocked</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
