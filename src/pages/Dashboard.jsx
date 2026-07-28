import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient.js'
import './Dashboard.css'
import Overview from './Overview.jsx'
import Subjects from './Subjects.jsx'
import Tasks from './Tasks.jsx'
import Timer from './Timer.jsx'

export default function Dashboard({ session }) {
  const [view, setView] = useState('overview')
  const [subjects, setSubjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const user = session?.user

  const fetchAll = useCallback(async () => {
    const [subRes, taskRes, sessRes] = await Promise.all([
      supabase.from('subjects').select('*').order('created_at', { ascending: true }),
      supabase.from('tasks').select('*, subject:subjects(*)').order('created_at', { ascending: false }),
      supabase.from('study_sessions').select('*, subject:subjects(*)').order('session_date', { ascending: false }),
    ])

    if (subRes.data) setSubjects(subRes.data)
    if (taskRes.data) setTasks(taskRes.data)
    if (sessRes.data) setSessions(sessRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const refresh = () => fetchAll()

  const handleSignOut = () => {
    supabase.auth.signOut()
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'M3 3v18h18M7 14l4-4 3 3 5-5' },
    { id: 'subjects', label: 'Subjects', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z' },
    { id: 'tasks', label: 'Tasks', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11' },
    { id: 'timer', label: 'Study Timer', icon: 'M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z' },
  ]

  const initials = user?.email?.[0]?.toUpperCase() || '?'

  return (
    <div className="dash">
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-head">
          <span className="brand-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
          </span>
          <span className="sidebar-title">StudyPlanner</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${view === item.id ? 'active' : ''}`}
              onClick={() => { setView(item.id); setSidebarOpen(false) }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon} /></svg>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="user-chip">
            <span className="user-avatar">{initials}</span>
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleSignOut} style={{ width: '100%', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />}

      <main className="dash-main">
        <header className="dash-header">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18" /></svg>
          </button>
          <h1 className="dash-title">{navItems.find((n) => n.id === view)?.label}</h1>
        </header>

        <div className="dash-content">
          {loading ? (
            <div className="dash-loading">
              <div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} />
            </div>
          ) : view === 'overview' ? (
            <Overview subjects={subjects} tasks={tasks} sessions={sessions} onNavigate={setView} />
          ) : view === 'subjects' ? (
            <Subjects subjects={subjects} onRefresh={refresh} />
          ) : view === 'tasks' ? (
            <Tasks subjects={subjects} tasks={tasks} onRefresh={refresh} />
          ) : view === 'timer' ? (
            <Timer subjects={subjects} sessions={sessions} onRefresh={refresh} />
          ) : null}
        </div>
      </main>
    </div>
  )
}
