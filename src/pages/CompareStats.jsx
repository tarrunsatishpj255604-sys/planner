import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { getStreak, levelFromXp } from '../lib/helpers.js'
import './CompareStats.css'

export default function CompareStats({ onNavigate, friendId }) {
  const { user, profile, sessions, tasks, subjects, friends } = useApp()
  const [friendProfile, setFriendProfile] = useState(null)
  const [friendSessions, setFriendSessions] = useState([])
  const [friendTasks, setFriendTasks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFriend = async () => {
      if (!friendId) { setLoading(false); return }
      const [pRes, sRes, tRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', friendId).maybeSingle(),
        supabase.from('study_sessions').select('*').eq('user_id', friendId).order('session_date', { ascending: false }),
        supabase.from('tasks').select('*').eq('user_id', friendId),
      ])
      if (pRes.data) setFriendProfile(pRes.data)
      if (sRes.data) setFriendSessions(sRes.data)
      if (tRes.data) setFriendTasks(tRes.data)
      setLoading(false)
    }
    fetchFriend()
  }, [friendId])

  if (!friendId) {
    return (
      <div className="cs-page">
        <div className="page-toolbar"><div><h2>Compare Stats</h2><p className="page-desc">See how you compare with your friends</p></div></div>
        {friends.length === 0 ? (
          <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📊</div><h3>No friends yet</h3><p>Add friends to compare your study stats.</p><button className="btn btn-primary" onClick={() => onNavigate('friends')}>Find Friends</button></div>
        ) : (
          <div className="cs-friend-pick">
            <h3>Select a friend to compare with:</h3>
            <div className="cs-pick-list">
              {friends.map(f => (
                <div key={f.id} className="cs-pick-card" onClick={() => onNavigate('comparestats', f.friend_id)}>
                  <span className="cs-pick-avatar" style={{ background: 'var(--primary)' }}>{f.friend?.avatar_emoji || '👤'}</span>
                  <span>{f.friend?.username || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) return <div className="card"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '20px auto' }} /></div>
  if (!friendProfile) return <div className="empty-state"><h3>Friend not found</h3><button className="btn btn-primary" onClick={() => onNavigate('friends')}>Back to Friends</button></div>

  const myStreak = getStreak(sessions)
  const friendStreak = getStreak(friendSessions)
  const myHours = Math.floor((profile?.total_minutes || 0) / 60)
  const friendHours = Math.floor((friendProfile.total_minutes || 0) / 60)
  const myTasks = tasks.filter(t => t.completed).length
  const friendCompletedTasks = friendTasks.filter(t => t.completed).length
  const myLevel = levelFromXp(profile?.xp || 0).level
  const friendLevel = levelFromXp(friendProfile.xp || 0).level

  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); const weekStr = weekAgo.toISOString().split('T')[0]
  const myWeekMin = sessions.filter(s => s.session_date >= weekStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const friendWeekMin = friendSessions.filter(s => s.session_date >= weekStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30); const monthStr = monthAgo.toISOString().split('T')[0]
  const myMonthMin = sessions.filter(s => s.session_date >= monthStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const friendMonthMin = friendSessions.filter(s => s.session_date >= monthStr).reduce((sum, s) => sum + (s.duration_minutes || 0), 0)

  const myAvgSession = sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length) : 0
  const friendAvgSession = friendSessions.length > 0 ? Math.round(friendSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / friendSessions.length) : 0

  const stats = [
    { label: 'Total Study Hours', me: myHours, friend: friendHours, unit: 'h' },
    { label: 'Weekly Study Time', me: Math.floor(myWeekMin / 60), friend: Math.floor(friendWeekMin / 60), unit: 'h' },
    { label: 'Monthly Study Time', me: Math.floor(myMonthMin / 60), friend: Math.floor(friendMonthMin / 60), unit: 'h' },
    { label: 'Current Streak', me: myStreak, friend: friendStreak, unit: 'd' },
    { label: 'Tasks Completed', me: myTasks, friend: friendCompletedTasks, unit: '' },
    { label: 'Level', me: myLevel, friend: friendLevel, unit: '' },
    { label: 'XP', me: profile?.xp || 0, friend: friendProfile.xp || 0, unit: '' },
    { label: 'Avg Session Length', me: myAvgSession, friend: friendAvgSession, unit: 'min' },
    { label: 'Subjects Studied', me: subjects.length, friend: 0, unit: '' },
  ]

  const maxVal = (s) => Math.max(s.me, s.friend, 1)
  const getInsights = () => {
    const insights = []
    if (myWeekMin > friendWeekMin * 1.2) insights.push(`You studied ${Math.round((myWeekMin / Math.max(friendWeekMin, 1) - 1) * 100)}% more this week!`)
    else if (friendWeekMin > myWeekMin * 1.2) insights.push(`${friendProfile.username} studied ${Math.round((friendWeekMin / Math.max(myWeekMin, 1) - 1) * 100)}% more this week.`)
    if (myStreak > friendStreak + 3) insights.push(`Your streak is ${myStreak - friendStreak} days longer!`)
    else if (friendStreak > myStreak + 3) insights.push(`${friendProfile.username}'s streak is ${friendStreak - myStreak} days longer.`)
    if (myTasks > friendTasks + 5) insights.push(`You completed ${myTasks - friendTasks} more tasks!`)
    insights.push(`Keep studying together to earn more XP!`)
    return insights
  }

  return (
    <div className="cs-page">
      <div className="page-toolbar"><div><h2>Compare Stats</h2><p className="page-desc">You vs {friendProfile.username}</p></div><button className="btn btn-ghost btn-sm" onClick={() => onNavigate('comparestats')}>← Back</button></div>

      <div className="cs-vs-header">
        <div className="cs-vs-side"><span className="cs-vs-avatar" style={{ background: 'var(--primary)' }}>{profile?.avatar_emoji || '🦊'}</span><span className="cs-vs-name">{profile?.username || 'You'}</span></div>
        <span className="cs-vs-label">VS</span>
        <div className="cs-vs-side"><span className="cs-vs-avatar" style={{ background: 'var(--accent)' }}>{friendProfile.avatar_emoji || '👤'}</span><span className="cs-vs-name">{friendProfile.username}</span></div>
      </div>

      <div className="cs-stats-grid">
        {stats.map((s, i) => {
          const max = maxVal(s)
          return (
            <div key={i} className="cs-stat-card">
              <h3>{s.label}</h3>
              <div className="cs-bars">
                <div className="cs-bar-row">
                  <span className="cs-bar-label">You</span>
                  <div className="cs-bar-track"><div className="cs-bar-fill" style={{ width: `${(s.me / max) * 100}%`, background: 'var(--primary)' }} /></div>
                  <span className="cs-bar-val">{s.me}{s.unit}</span>
                </div>
                <div className="cs-bar-row">
                  <span className="cs-bar-label">{friendProfile.username?.slice(0, 8)}</span>
                  <div className="cs-bar-track"><div className="cs-bar-fill" style={{ width: `${(s.friend / max) * 100}%`, background: 'var(--accent)' }} /></div>
                  <span className="cs-bar-val">{s.friend}{s.unit}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <div className="card-head"><h3>Insights</h3></div>
        <div className="cs-insights">{getInsights().map((ins, i) => <div key={i} className="cs-insight">💡 {ins}</div>)}</div>
      </div>
    </div>
  )
}
