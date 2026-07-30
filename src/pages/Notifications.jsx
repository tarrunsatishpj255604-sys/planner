import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import './Notifications.css'

export default function Notifications() {
  const { user, notifications, markNotificationRead, markAllNotificationsRead, refresh } = useApp()
  const [filter, setFilter] = useState('all')

  const deleteNotification = async (id) => {
    await supabase.from('notifications').delete().eq('id', id); refresh()
  }

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'friend') return n.type.includes('friend')
    if (filter === 'note') return n.type.includes('note') || n.type.includes('like') || n.type.includes('comment')
    return true
  })

  const getIcon = (type) => {
    if (type.includes('friend')) return '👥'
    if (type.includes('note') || type.includes('like') || type.includes('comment')) return '📝'
    if (type.includes('session') || type.includes('room')) return '🏠'
    if (type.includes('leaderboard')) return '🏆'
    if (type.includes('achievement')) return '🎖️'
    return '🔔'
  }

  const formatTime = (dateStr) => {
    const d = new Date(dateStr), now = new Date()
    const diff = (now - d) / 1000
    if (diff < 60) return 'Just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="notif-page">
      <div className="page-toolbar">
        <div><h2>Notifications</h2><p className="page-desc">Stay updated on your social activity</p></div>
        {notifications.some(n => !n.is_read) && <button className="btn btn-outline btn-sm" onClick={markAllNotificationsRead}>Mark all read</button>}
      </div>

      <div className="notif-filters">
        <button className={`filter-chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>All</button>
        <button className={`filter-chip ${filter === 'unread' ? 'active' : ''}`} onClick={() => setFilter('unread')}>Unread</button>
        <button className={`filter-chip ${filter === 'friend' ? 'active' : ''}`} onClick={() => setFilter('friend')}>Friends</button>
        <button className={`filter-chip ${filter === 'note' ? 'active' : ''}`} onClick={() => setFilter('note')}>Notes</button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>🔔</div><h3>No notifications</h3><p>You're all caught up!</p></div>
      ) : (
        <div className="notif-list">
          {filtered.map(n => (
            <div key={n.id} className={`notif-item ${n.is_read ? 'read' : 'unread'}`} onClick={() => !n.is_read && markNotificationRead(n.id)}>
              <span className="notif-icon">{getIcon(n.type)}</span>
              <div className="notif-content">
                <span className="notif-title">{n.title}</span>
                {n.body && <span className="notif-body">{n.body}</span>}
                <span className="notif-time">{formatTime(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="notif-dot" />}
              <button className="notif-delete" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id) }}>×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
