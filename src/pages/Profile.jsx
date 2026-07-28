import { useState } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { levelFromXp, getStreak, AVATAR_OPTIONS, ACHIEVEMENT_DEFS } from '../lib/helpers.js';
import './ProfilePage.css';

export default function Profile() {
  const { profile, subjects, tasks, sessions, achievements, updateProfile } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: profile?.username || '', avatar: profile?.avatar || AVATAR_OPTIONS[0], daily_goal_minutes: profile?.daily_goal_minutes || 120 });

  const level = levelFromXp(profile?.xp || 0);
  const streak = getStreak(profile);
  const totalTime = (sessions || []).reduce((s, x) => s + (x.duration || 0), 0);
  const tasksDone = (tasks || []).filter(t => t.completed).length;

  const unlocked = achievements || [];
  const recent = ACHIEVEMENT_DEFS.filter(a => unlocked.includes(a.id)).slice(-5).reverse();

  const save = async () => {
    await updateProfile({ username: form.username, avatar: form.avatar, daily_goal_minutes: Number(form.daily_goal_minutes) });
    setEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-banner">
        <div className="profile-avatar">{profile?.avatar || '😀'}</div>
        <div className="profile-info">
          <h1>{profile?.username || 'Learner'}</h1>
          <span className="level-badge">Level {level.level}</span>
        </div>
        <button className="btn btn-outline" onClick={() => setEditing(e => !e)}>{editing ? 'Close' : '✏️ Edit'}</button>
      </div>

      {editing && (
        <div className="card form-card">
          <div className="form-field"><label>Username</label><input type="text" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} /></div>
          <div className="form-field">
            <label>Avatar</label>
            <div className="avatar-picker">
              {AVATAR_OPTIONS.map(a => (
                <button key={a} className={`avatar-opt ${form.avatar === a ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, avatar: a }))}>{a}</button>
              ))}
            </div>
          </div>
          <div className="form-field"><label>Daily Goal (minutes)</label><input type="number" value={form.daily_goal_minutes} onChange={e => setForm(f => ({ ...f, daily_goal_minutes: e.target.value }))} /></div>
          <div className="form-actions"><button className="btn btn-primary" onClick={save}>Save</button></div>
        </div>
      )}

      <div className="card xp-card">
        <div className="card-head"><h3>Level {level.level}</h3></div>
        <div className="xp-bar"><div className="xp-fill" style={{ width: `${level.progress}%` }} /></div>
        <div className="xp-text">{profile?.xp || 0} XP · {level.xpForNext} to next level</div>
      </div>

      <div className="grid-4">
        <div className="card stat-card"><div className="stat-icon">🔥</div><div className="stat-value">{streak}</div><div className="stat-label">Day Streak</div></div>
        <div className="card stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{Math.round(totalTime)}m</div><div className="stat-label">Total Time</div></div>
        <div className="card stat-card"><div className="stat-icon">✅</div><div className="stat-value">{tasksDone}</div><div className="stat-label">Tasks Done</div></div>
        <div className="card stat-card"><div className="stat-icon">📚</div><div className="stat-value">{(subjects || []).length}</div><div className="stat-label">Subjects</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Recent Achievements</h3></div>
        {recent.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏆</div><p>No achievements yet</p></div>
        ) : (
          <ul className="ach-list">
            {recent.map(a => (
              <li key={a.id}><span className="ach-icon">{a.icon}</span><div><strong>{a.name}</strong><div className="muted">{a.description}</div></div></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
