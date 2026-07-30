import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { getStreak } from '../lib/helpers.js'
import './Leaderboards.css'

export default function Leaderboards() {
  const { user, profile, sessions, tasks, friends } = useApp()
  const [category, setCategory] = useState('weekly')
  const [scope, setScope] = useState('global')
  const [boardData, setBoardData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBoard = async () => {
      setLoading(true)
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      const weekStr = weekAgo.toISOString().split('T')[0]

      let query = supabase.from('profiles').select('user_id, username, avatar_emoji, xp, level, total_minutes, completed_tasks, study_streak, show_on_leaderboard').eq('show_on_leaderboard', true)

      if (scope === 'friends') {
        const friendIds = friends.map(f => f.friend_id)
        if (friendIds.length === 0) { setBoardData([]); setLoading(false); return }
        query = query.in('user_id', [...friendIds, user.id])
      }

      const { data: profiles } = await query.limit(100)
      if (!profiles) { setBoardData([]); setLoading(false); return }

      const friendIds = friends.map(f => f.friend_id)
      const allIds = scope === 'friends' ? [...friendIds, user.id] : profiles.map(p => p.user_id)
      const sessRes = await supabase.from('study_sessions').select('user_id, duration_minutes, session_date').in('user_id', allIds).gte('session_date', weekStr)
      const taskRes = scope === 'friends' ? { data: [] } : await supabase.from('tasks').select('user_id, completed').in('user_id', allIds).eq('completed', true)

      const weekMinutes = {}
      sessRes.data?.forEach(s => { weekMinutes[s.user_id] = (weekMinutes[s.user_id] || 0) + (s.duration_minutes || 0) })
      const taskCounts = {}
      taskRes.data?.forEach(t => { taskCounts[t.user_id] = (taskCounts[t.user_id] || 0) + 1 })

      const ranked = profiles.map(p => ({
        userId: p.user_id,
        username: p.username,
        avatar: p.avatar_emoji,
        xp: p.xp || 0,
        level: p.level || 1,
        weeklyMinutes: weekMinutes[p.user_id] || 0,
        streak: p.study_streak || 0,
        tasksCompleted: taskCounts[p.user_id] || p.completed_tasks || 0,
        totalHours: Math.floor((p.total_minutes || 0) / 60),
      }))

      const sortKey = category === 'weekly' ? 'weeklyMinutes' : category === 'xp' ? 'xp' : category === 'streak' ? 'streak' : 'tasksCompleted'
      ranked.sort((a, b) => b[sortKey] - a[sortKey])

      const rankedWithRank = ranked.map((entry, i) => ({ ...entry, rank: i + 1, prevRank: i + 1 }))
      setBoardData(rankedWithRank)
      setLoading(false)
    }
    fetchBoard()
  }, [category, scope, friends, user])

  const CATEGORIES = [
    { key: 'weekly', label: 'Weekly Study Time', icon: '⏱️' },
    { key: 'xp', label: 'XP Leaderboard', icon: '⚡' },
    { key: 'streak', label: 'Streak Leaderboard', icon: '🔥' },
    { key: 'tasks', label: 'Task Completion', icon: '✅' },
  ]

  const SCOPES = ['friends', 'global']

  const getValue = (entry) => {
    if (category === 'weekly') return `${Math.floor(entry.weeklyMinutes / 60)}h ${entry.weeklyMinutes % 60}m`
    if (category === 'xp') return `${entry.xp} XP`
    if (category === 'streak') return `${entry.streak} days`
    return `${entry.tasksCompleted} tasks`
  }

  const getMedal = (rank) => rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`

  return (
    <div className="lb-page">
      <div className="page-toolbar"><div><h2>Leaderboards</h2><p className="page-desc">See how you stack up against other students</p></div></div>

      <div className="lb-categories">{CATEGORIES.map(c => <button key={c.key} className={`lb-cat ${category === c.key ? 'active' : ''}`} onClick={() => setCategory(c.key)}><span>{c.icon}</span><span>{c.label}</span></button>)}</div>
      <div className="lb-scopes">{SCOPES.map(s => <button key={s} className={`lb-scope ${scope === s ? 'active' : ''}`} onClick={() => setScope(s)}>{s === 'friends' ? 'Friends Only' : 'Global'}</button>)}</div>

      {loading ? (
        <div className="card"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', margin: '20px auto' }} /></div>
      ) : boardData.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>📊</div><h3>No data yet</h3><p>{scope === 'friends' ? 'Add friends to see this leaderboard.' : 'Be the first to appear here!'}</p></div>
      ) : (
        <div className="lb-list">
          {boardData.map((entry, i) => {
            const isMe = entry.userId === user.id
            return (
              <div key={entry.userId} className={`lb-row ${isMe ? 'me' : ''} ${entry.rank <= 3 ? 'top' : ''}`}>
                <span className="lb-rank">{getMedal(entry.rank)}</span>
                <span className="lb-avatar" style={{ background: isMe ? 'var(--primary)' : 'var(--surface-2)' }}>{entry.avatar || '👤'}</span>
                <div className="lb-user"><span className="lb-name">{entry.username}{isMe && <span className="lb-you"> (You)</span>}</span><div className="lb-sub"><span>⭐ Lvl {entry.level}</span><span>🔥 {entry.streak}d</span><span>⏱️ {entry.totalHours}h</span></div></div>
                <span className="lb-value">{getValue(entry)}</span>
                <span className="lb-movement">→</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
