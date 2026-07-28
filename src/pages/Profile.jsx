import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { levelFromXp, getStreak, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './ProfilePage.css'

export default function Profile() {
  const { profile, tasks, sessions, achievements, updateProfile, loading } = useApp()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState('')
  const [avatar, setAvatar] = useState('')
  const [dailyGoal, setDailyGoal] = useState(120)

  const xpInfo = useMemo(() => levelFromXp(profile?.xp || 0), [profile])
  const streak = useMemo(() => getStreak(sessions), [sessions])
  const totalMins = useMemo(() => (sessions || []).reduce((sum, s) => sum + (s.duration_minutes || 0), 0), [sessions])
  const completedTasks = useMemo(() => (tasks || []).filter(t => t.completed).length, [tasks])

  const unlockedKeys = useMemo(() => new Set((achievements || []).map(a => a.key)), [achievements])
  const recentAchievements = useMemo(() => ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).slice(-6), [unlockedKeys])

  const startEdit = () => { setUsername(profile?.username || ''); setAvatar(profile?.avatar_emoji || AVATAR_OPTIONS[0]); setDailyGoal(profile?.daily_goal_minutes || 120); setEditing(true) }
  const save = () => { updateProfile({ username, avatar_emoji: avatar, daily_goal_minutes: dailyGoal }); setEditing(false) }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="profile-page">
      <div className="profile-banner" style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}>
        <div className="profile-banner-info">
          <span className="profile-avatar" style={{ background: 'rgba(255,255,255,0.25)' }}>{profile?.avatar_emoji || '🦊'}</span>
          <div><h1 style={{ color: '#fff' }}>{profile?.username || 'Student'}</h1><span className="profile-level-badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>Level {xpInfo.level}</span></div>
        </div>
        <button className="btn btn-ghost btn-sm profile-edit-btn" style={{ color: '#fff', background: 'rgba(255,255,255,0.2)' }} onClick={startEdit}>✏️ Edit</button>
      </div>

      {editing && (
        <div className="form-card">
          <div className="form-head"><h3>Edit Profile</h3><button className="close-btn" onClick={() => setEditing(false)}>✕</button></div>
          <div className="form-field"><label>Username</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} /></div>
          <div className="form-field"><label>Avatar</label><div className="avatar-picker">{AVATAR_OPTIONS.map(a => <button key={a} className={`avatar-swatch ${avatar === a ? 'selected' : ''}`} onClick={() => setAvatar(a)}>{a}</button>)}</div></div>
          <div className="form-field"><label>Daily Goal (minutes)</label><input type="number" min="30" max="600" step="15" value={dailyGoal} onChange={e => setDailyGoal(parseInt(e.target.value) || 120)} /></div>
          <div className="form-actions"><button className="btn btn-ghost" onClick={() => setEditing(false)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save Changes</button></div>
        </div>
      )}

      <div className="card xp-card">
        <div className="card-head"><h3>Experience Points</h3><span className="level-badge" style={{ background: 'var(--primary)' }}>Lv {xpInfo.level}</span></div>
        <div className="xp-progress-wrap"><div className="xp-progress-bar"><div className="xp-progress-fill" style={{ width: `${xpInfo.progress * 100}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div><span className="xp-progress-text">{xpInfo.currentLevelXp} / {xpInfo.nextLevelXp} XP</span></div>
        <p className="xp-hint">{xpInfo.nextLevelXp - xpInfo.currentLevelXp} XP to level {xpInfo.level + 1}</p>
      </div>

      <div className="grid-4">
        <div className="card stat-card"><div className="stat-emoji">🔥</div><div className="stat-info"><span className="stat-value">{streak}</span><span className="stat-label">Day Streak</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">⏱️</div><div className="stat-info"><span className="stat-value">{Math.floor(totalMins / 60)}h</span><span className="stat-label">Total Study</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">✅</div><div className="stat-info"><span className="stat-value">{completedTasks}</span><span className="stat-label">Tasks Done</span></div></div>
        <div className="card stat-card"><div className="stat-emoji">⭐</div><div className="stat-info"><span className="stat-value">{profile?.xp || 0}</span><span className="stat-label">Total XP</span></div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recentAchievements.length === 0 ? <div className="dash-empty">No achievements unlocked yet. Keep studying! 🏆</div> : (
          <div className="profile-achievements">
            {recentAchievements.map(a => <div key={a.key} className="pa-item"><span className="pa-icon">{a.icon}</span><div><span className="pa-title">{a.title}</span><span className="pa-desc">{a.desc}</span></div></div>)}
          </div>
        )}
      </div>
    </div>
  )
}
