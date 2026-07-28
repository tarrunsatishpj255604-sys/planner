import './Overview.css'

const PRIORITY_COLORS = {
  high: { bg: 'var(--error-l)', color: 'var(--error)' },
  medium: { bg: 'var(--warning-l)', color: 'var(--warning)' },
  low: { bg: 'var(--success-l)', color: 'var(--success)' },
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff < 0) return `${Math.abs(diff)}d overdue`
  if (diff <= 7) return `In ${diff}d`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Overview({ subjects, tasks, sessions, onNavigate }) {
  const completedTasks = tasks.filter((t) => t.completed).length
  const pendingTasks = tasks.filter((t) => !t.completed).length
  const totalStudyMin = sessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const studyHours = Math.floor(totalStudyMin / 60)
  const studyMins = totalStudyMin % 60

  const upcoming = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date) - new Date(b.due_date)
    })
    .slice(0, 5)

  const weekMin = sessions
    .filter((s) => {
      const d = new Date(s.session_date)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return d >= weekAgo
    })
    .reduce((sum, s) => sum + s.duration_minutes, 0)

  const stats = [
    {
      label: 'Subjects', value: subjects.length, icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z',
      color: 'var(--primary)', bg: 'var(--primary-l)',
      action: () => onNavigate('subjects'),
    },
    {
      label: 'Pending tasks', value: pendingTasks, icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
      color: 'var(--warning)', bg: 'var(--warning-l)',
      action: () => onNavigate('tasks'),
    },
    {
      label: 'Tasks done', value: completedTasks, icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
      color: 'var(--success)', bg: 'var(--success-l)',
    },
    {
      label: 'Study time (total)', value: `${studyHours}h ${studyMins}m`, icon: 'M12 13V9M12 5V3M5 3 2 6M22 6l-3-3M12 21a8 8 0 1 1 0-16 8 8 0 0 1 0 16z',
      color: '#ec4899', bg: '#fce7f3',
      action: () => onNavigate('timer'),
    },
  ]

  const maxSubjectMin = Math.max(
    ...subjects.map((s) => sessions.filter((sess) => sess.subject_id === s.id).reduce((sum, sess) => sum + sess.duration_minutes, 0)),
    1
  )

  return (
    <div className="overview">
      <div className="stat-grid">
        {stats.map((s) => (
          <button key={s.label} className="stat-card" onClick={s.action} disabled={!s.action}>
            <div className="stat-icon" style={{ background: s.bg, color: s.color }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{s.value}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="ov-columns">
        <div className="ov-card">
          <div className="ov-card-head">
            <h3>Upcoming tasks</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => onNavigate('tasks')}>View all</button>
          </div>
          {upcoming.length === 0 ? (
            <div className="ov-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
              <p>No pending tasks. You're all caught up!</p>
            </div>
          ) : (
            <div className="task-list">
              {upcoming.map((t) => {
                const pc = PRIORITY_COLORS[t.priority] || PRIORITY_COLORS.medium
                return (
                  <div key={t.id} className="task-row">
                    <span className="task-priority-dot" style={{ background: pc.color }} />
                    <div className="task-row-info">
                      <span className="task-row-title">{t.title}</span>
                      {t.subject && <span className="task-row-subject" style={{ color: t.subject.color }}>{t.subject.name}</span>}
                    </div>
                    {t.due_date && (
                      <span className="task-due" style={{ color: formatDate(t.due_date).includes('overdue') ? 'var(--error)' : 'var(--text-3)' }}>
                        {formatDate(t.due_date)}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="ov-card">
          <div className="ov-card-head">
            <h3>Study time by subject</h3>
            <span className="ov-week-badge">{Math.floor(weekMin / 60)}h {weekMin % 60}m this week</span>
          </div>
          {subjects.length === 0 ? (
            <div className="ov-empty">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2" /></svg>
              <p>Add subjects to start tracking study time.</p>
            </div>
          ) : (
            <div className="study-bars">
              {subjects.map((s) => {
                const mins = sessions.filter((sess) => sess.subject_id === s.id).reduce((sum, sess) => sum + sess.duration_minutes, 0)
                const pct = mins > 0 ? Math.max((mins / maxSubjectMin) * 100, 4) : 0
                const hrs = Math.floor(mins / 60)
                const m = mins % 60
                return (
                  <div key={s.id} className="study-bar-row">
                    <span className="sb-label">
                      <span className="sb-dot" style={{ background: s.color }} />
                      {s.name}
                    </span>
                    <div className="sb-track">
                      <div className="sb-fill" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                    <span className="sb-time">{hrs > 0 ? `${hrs}h ${m}m` : `${m}m`}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
