import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, getStreak, AVATAR_OPTIONS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, subjects, tasks, sessions, achievements, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [avatar, setAvatar] = useState(profile?.avatar_emoji || '🦊')
  const [dailyGoal, setDailyGoal] = useState(profile?.daily_goal_minutes || 120)

  if (!profile) return null

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp)
  const streak = getStreak(sessions)
  const totalHours = Math.floor(profile.total_minutes / 60)
  const completedTasks = tasks.filter(t => t.completed).length

  const save = async () => {
    await updateProfile({ username: username.trim() || 'Student', avatar_emoji: avatar, daily_goal_minutes: dailyGoal })
    setEditing(false)
  }

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <div className="profile-avatar">{profile.avatar_emoji}</div>
        <div className="profile-info">
          <h2>{profile.username}</h2>
          <span className="profile-email">{profile.user_id ? '' : ''}</span>
          <div className="profile-level-badge">Level {level}</div>
        </div>
        <button className="btn btn-outline btn-sm profile-edit" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={() => setEditing(!editing)}>
          {editing ? 'Cancel' : 'Edit profile'}
        </button>
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
                <button key={a} className={`avatar-opt ${avatar === a ? 'sel' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Daily study goal (minutes)</label>
            <input type="number" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 120)} min="15" max="600" />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          </div>
        </div>
      )}

      <div className="profile-xp-card card">
        <div className="pxp-head">
          <span className="pxp-badge" style={{ background: 'var(--primary)' }}>Level {level}</span>
          <span className="pxp-total">{profile.xp} XP</span>
        </div>
        <div className="pxp-bar">
          <div className="pxp-bar-fill" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} />
        </div>
        <span className="pxp-text">{currentLevelXp} / {nextLevelXp} XP to level {level + 1}</span>
      </div>

      <div className="grid-4">
        <div className="card stat-mini">
          <span className="ps-big">🔥 {streak}</span>
          <span className="ps-label">Day streak</span>
        </div>
        <div className="card stat-mini">
          <span className="ps-big">{totalHours}h</span>
          <span className="ps-label">Total studied</span>
        </div>
        <div className="card stat-mini">
          <span className="ps-big">{completedTasks}</span>
          <span className="ps-label">Tasks done</span>
        </div>
        <div className="card stat-mini">
          <span className="ps-big">{subjects.length}</span>
          <span className="ps-label">Subjects</span>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {achievements.length === 0 ? (
          <p className="dash-empty">No achievements unlocked yet. Complete tasks and study to earn them!</p>
        ) : (
          <div className="profile-achievements">
            {achievements.map(a => (
              <div key={a.id} className="pa-item">
                <span className="pa-icon">🏆</span>
                <div><span className="pa-title">{a.key.replace(/_/g, ' ')}</span><span className="pa-date">{new Date(a.unlocked_at).toLocaleDateString()}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
