import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements } = useApp()
  const unlocked = new Set(achievements.map(a => a.key))
  const unlockedCount = ACHIEVEMENT_DEFS.filter(def => unlocked.has(def.key)).length
  const total = ACHIEVEMENT_DEFS.length
  const pct = Math.round((unlockedCount / total) * 100)

  return (
    <div className="ach-page">
      <div className="page-toolbar"><div><h2>Achievements</h2><p className="page-desc">Unlock {total} achievements as you study</p></div></div>

      <div className="card">
        <div className="ach-progress-bar-wrap">
          <div className="ach-progress-bar" style={{ width: `${pct}%`, background: 'var(--primary)' }} />
        </div>
        <div className="ach-progress-text">{unlockedCount} / {total} unlocked ({pct}%)</div>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map((def, i) => {
          const isUnlocked = unlocked.has(def.key)
          return (
            <div key={i} className={`ach-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
              <span className="ach-icon" style={isUnlocked ? {} : { filter: 'grayscale(1)', opacity: 0.4 }}>{def.icon}</span>
              <div className="ach-info">
                <span className="ach-title">{def.title}</span>
                <span className="ach-desc">{def.desc}</span>
              </div>
              {isUnlocked && <span className="ach-check">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
