import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements, loading } = useApp()

  if (loading) return <div className="ach-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).length
  const total = ACHIEVEMENT_DEFS.length
  const pct = Math.round((unlockedCount / total) * 100)

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Achievements</h2><p className="page-desc">Unlock badges as you study and grow.</p></div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-top">
          <h3>{unlockedCount} / {total} Unlocked</h3>
          <span className="ach-pct">{pct}%</span>
        </div>
        <div className="ach-progress-bar-track"><div className="ach-progress-bar-fill" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map(def => {
          const unlocked = unlockedKeys.has(def.key)
          return (
            <div key={def.key} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="ach-icon">{def.icon}</span>
              <div className="ach-info">
                <strong className="ach-title">{def.title}</strong>
                <p className="ach-desc">{def.desc}</p>
              </div>
              {unlocked ? <span className="ach-check">✓</span> : <span className="ach-lock">🔒</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
