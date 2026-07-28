import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabaseClient.js'
import { useApp } from './lib/AppContext.jsx'
import { THEMES } from './lib/helpers.js'
import './Shell.css'

import Dashboard from './pages/Dashboard.jsx'
import SubjectList from './pages/SubjectList.jsx'
import SubjectDetail from './pages/SubjectDetail.jsx'
import Tasks from './pages/Tasks.jsx'
import Calendar from './pages/Calendar.jsx'
import Focus from './pages/Focus.jsx'
import Notes from './pages/Notes.jsx'
import Flashcards from './pages/Flashcards.jsx'
import Analytics from './pages/Analytics.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import Friends from './pages/Friends.jsx'
import AIAssistant from './pages/AIAssistant.jsx'
import Files from './pages/Files.jsx'
import Achievements from './pages/Achievements.jsx'

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: 'M3 3v18h18M7 14l4-4 3 3 5-5' },
  { id: 'calendar', label: 'Calendar', icon: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' },
  { id: 'tasks', label: 'Tasks', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
  { id: 'subjects', label: 'Subjects', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
  { id: 'notes', label: 'Notes', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8' },
  { id: 'flashcards', label: 'Flashcards', icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M7 9h10 M7 13h6' },
  { id: 'focus', label: 'Focus', icon: 'M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z' },
  { id: 'analytics', label: 'Analytics', icon: 'M3 3v18h18M7 14l4-4 3 3 5-5' },
  { id: 'friends', label: 'Friends', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75' },
  { id: 'files', label: 'Files', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z' },
  { id: 'ai', label: 'AI Assistant', icon: 'M12 2a3 3 0 0 1 3 3c0 1.5-1 2-1 3.5S16 11 17 11a3 3 0 0 1 0 6c-1 0-2 .5-2 2s1 1.5 1 3a3 3 0 0 1-6 0c0-1.5 1-2 1-3s-2-2-3-2a3 3 0 0 1 0-6c1 0 2-.5 2-2S9 6.5 9 5a3 3 0 0 1 3-3z' },
  { id: 'achievements', label: 'Achievements', icon: 'M6 9H4.5a2.5 2.5 0 0 1 0-5H6 M18 9h1.5a2.5 2.5 0 0 0 0-5H18 M4 22h16 M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22 M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22 M18 2H6v7a6 6 0 0 0 12 0V2z' },
  { id: 'profile', label: 'Profile', icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' },
  { id: 'settings', label: 'Settings', icon: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' },
]

export default function Shell({ session }) {
  const { settings, profile, subjects } = useApp()
  const [route, setRoute] = useState('dashboard')
  const [subjectId, setSubjectId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const theme = THEMES[settings?.theme] || THEMES.default
  const primary = settings?.primary_color || '#4f7cff'
  const accent = settings?.accent_color || '#ec4899'
  const radius = settings?.border_radius || 12
  const animations = settings?.animations_enabled !== false

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--bg', theme.bg)
    root.style.setProperty('--surface', theme.surface)
    root.style.setProperty('--text', theme.text)
    root.style.setProperty('--text-2', theme.text2)
    root.style.setProperty('--border', theme.border)
    root.style.setProperty('--sidebar-bg', theme.sidebar)
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--accent', accent)
    root.style.setProperty('--radius', `${radius}px`)
    root.style.setProperty('--radius-sm', `${Math.max(radius - 4, 4)}px`)
    root.style.setProperty('--surface-2', theme.dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)')
    root.style.setProperty('--primary-l', theme.dark ? 'rgba(79,124,255,0.15)' : 'rgba(79,124,255,0.1)')
    root.style.setProperty('--shadow-sm', theme.dark ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.04)')
    root.style.setProperty('--shadow', theme.dark ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.06)')
    root.style.setProperty('--shadow-md', theme.dark ? '0 4px 16px rgba(0,0,0,0.4)' : '0 4px 16px rgba(0,0,0,0.08)')
    root.style.setProperty('--shadow-lg', theme.dark ? '0 12px 40px rgba(0,0,0,0.5)' : '0 12px 40px rgba(0,0,0,0.12)')
    root.style.setProperty('--success-l', theme.dark ? 'rgba(34,197,94,0.15)' : '#e8f9ee')
    root.style.setProperty('--warning-l', theme.dark ? 'rgba(245,158,11,0.15)' : '#fef4e6')
    root.style.setProperty('--error-l', theme.dark ? 'rgba(239,68,68,0.15)' : '#fee8e8')
  }, [theme, primary, accent, radius])

  const navigate = useCallback((id, subId) => {
    setRoute(id)
    if (subId) setSubjectId(subId)
    setSidebarOpen(false)
  }, [])

  const handleSignOut = () => supabase.auth.signOut()

  const initials = profile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'
  const user = session?.user

  const renderPage = () => {
    switch (route) {
      case 'dashboard': return <Dashboard onNavigate={navigate} />
      case 'subjects': return <SubjectList onNavigate={navigate} />
      case 'subject-detail': return <SubjectDetail subjectId={subjectId} onNavigate={navigate} />
      case 'tasks': return <Tasks />
      case 'calendar': return <Calendar />
      case 'focus': return <Focus />
      case 'notes': return <Notes />
      case 'flashcards': return <Flashcards />
      case 'analytics': return <Analytics />
      case 'profile': return <Profile />
      case 'settings': return <Settings />
      case 'friends': return <Friends />
      case 'ai': return <AIAssistant />
      case 'files': return <Files />
      case 'achievements': return <Achievements />
      default: return <Dashboard onNavigate={navigate} />
    }
  }

  const navLabel = NAV.find(n => n.id === route)?.label || (route === 'subject-detail' ? subjects.find(s => s.id === subjectId)?.name || 'Subject' : 'Dashboard')

  return (
    <div className={`shell ${animations ? 'with-anim' : ''}`}>
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} style={{ background: 'var(--sidebar-bg)' }}>
        <div className="sidebar-head">
          <span className="brand-icon" style={{ background: 'var(--primary)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </span>
          <span className="sidebar-title">StudySpace</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${route === item.id ? 'active' : ''}`}
              onClick={() => navigate(item.id)}
              style={route === item.id ? { background: 'var(--primary)', color: '#fff' } : {}}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="user-chip" onClick={() => navigate('profile')}>
            <span className="user-avatar" style={{ background: 'var(--primary)' }}>{profile?.avatar_emoji || initials}</span>
            <div className="user-info">
              <span className="user-name">{profile?.username || 'Student'}</span>
              <span className="user-level">Level {profile?.level || 1}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm signout-btn" onClick={handleSignOut}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="shell-main">
        <header className="shell-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <h1 className="shell-title">{navLabel}</h1>
        </header>
        <div className="shell-content" key={route}>
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
