import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements, loading } = useApp()

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = unlockedKeys.size
  const totalCount = ACHIEVEMENT_DEFS.length
  const pct = totalCount ? (unlockedCount / totalCount) * 100 : 0

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div><h2>Achievements</h2><p className="page-desc">Unlock achievements by studying, completing tasks, and reaching milestones.</p></div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-header">
          <h3>Progress</h3>
          <span className="ach-count">{unlockedCount} / {totalCount}</span>
        </div>
        <div className="ach-progress-bar">
          <div className="ach-progress-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} />
        </div>
        <p className="ach-progress-text">{Math.round(pct)}% complete</p>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map(def => {
          const unlocked = unlockedKeys.has(def.key)
          return (
            <div key={def.key} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon-wrap">
                <span className="ach-icon">{unlocked ? def.icon : '🔒'}</span>
              </div>
              <div className="ach-info">
                <span className="ach-title">{def.title}</span>
                <span className="ach-desc">{def.desc}</span>
              </div>
              {unlocked && <span className="ach-badge">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
