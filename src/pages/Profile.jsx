import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, ACHIEVEMENT_DEFS, AVATAR_OPTIONS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, sessions, tasks, achievements, updateProfile } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [dailyGoal, setDailyGoal] = useState(120)

  if (!profile) return null

  const { level, currentLevelXp, nextLevelXp, progress } = levelFromXp(profile.xp || 0)
  const totalTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const totalTasks = tasks.filter(t => t.completed).length
  const unlockedAch = ACHIEVEMENT_DEFS.filter(def => achievements.some(a => a.key === def.key))
  const recentAch = unlockedAch.slice(-5).reverse()

  const startEdit = () => { setUsername(profile.username || ''); setAvatar(profile.avatar_emoji || AVATAR_OPTIONS[0]); setDailyGoal(profile.daily_goal_minutes || 120); setEditing(true) }
  const save = () => { updateProfile({ username, avatar_emoji: avatar, daily_goal_minutes: dailyGoal }); setEditing(false) }

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent))' }}>
        <span className="profile-avatar">{profile.avatar_emoji || '🦊'}</span>
        <div className="profile-info"><h2>{profile.username || 'Student'}</h2><span className="profile-level-badge">Level {profile.level || 1}</span></div>
        <button className="btn btn-outline" style={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)' }} onClick={startEdit}>Edit Profile</button>
      </div>

      {editing && (
        <div className="form-card">
          <h3>Edit Profile</h3>
          <div className="form-field"><label>Username</label><input value={username} onChange={e => setUsername(e.target.value)} /></div>
          <div className="form-field"><label>Avatar</label><div className="avatar-picker">{AVATAR_OPTIONS.map(a => <button key={a} className={`avatar-btn ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>)}</div></div>
          <div className="form-field"><label>Daily Goal: {dailyGoal} minutes</label><input type="range" min="30" max="480" step="30" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value))} /></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button></div>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>XP & Level</h3></div>
        <div className="xp-info">
          <div className="xp-level-badge" style={{ background: 'var(--primary)' }}>Lvl {level}</div>
          <div className="xp-bar-wrap"><div className="xp-bar" style={{ width: `${progress * 100}%`, background: 'var(--primary)' }} /></div>
          <div className="xp-text">{currentLevelXp} / {nextLevelXp} XP</div>
        </div>
        <div className="xp-stats"><span>Total XP: {profile.xp || 0}</span></div>
      </div>

      <div className="grid-4">
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>⏱️</div><div><div className="stat-val">{Math.floor(totalTime / 60)}h</div><div className="stat-label">Study Time</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--success-l)', color: 'var(--success)' }}>✅</div><div><div className="stat-val">{totalTasks}</div><div className="stat-label">Tasks Done</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: 'var(--warning-l)', color: 'var(--warning)' }}>📅</div><div><div className="stat-val">{sessions.length}</div><div className="stat-label">Sessions</div></div></div>
        <div className="stat-card"><div className="stat-icon" style={{ background: '#fce7f3', color: 'var(--accent)' }}>🏆</div><div><div className="stat-val">{unlockedAch.length}</div><div className="stat-label">Achievements</div></div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAch.length === 0 ? <div className="dash-empty">No achievements unlocked yet.</div> : (
          <div className="recent-ach-list">
            {recentAch.map((ach, i) => <div key={i} className="recent-ach-item"><span className="ach-icon">{ach.icon}</span><div><strong>{ach.title}</strong><p className="dash-empty">{ach.desc}</p></div></div>)}
          </div>
        )}
      </div>
    </div>
  )
}
