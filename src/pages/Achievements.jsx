import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements, loading } = useApp()

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = unlockedKeys.size
  const totalDefs = ACHIEVEMENT_DEFS.length
  const pct = Math.round((unlockedCount / totalDefs) * 100)

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Achievements</h2>
          <p className="page-desc">Unlock {totalDefs} achievements by studying, completing tasks, and more.</p>
        </div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-info">
          <h3>{unlockedCount} / {totalDefs} Unlocked</h3>
          <span>{pct}% complete</span>
        </div>
        <div className="ach-progress-bar">
          <div className="ach-progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
        </div>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map(def => {
          const unlocked = unlockedKeys.has(def.key)
          return (
            <div key={def.key} className={`card ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="ach-card-icon">{def.icon}</span>
              <span className="ach-card-title">{def.title}</span>
              <span className="ach-card-desc">{def.desc}</span>
              {unlocked ? (
                <span className="ach-card-badge unlocked-badge">✓ Unlocked</span>
              ) : (
                <span className="ach-card-badge locked-badge">🔒 Locked</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
