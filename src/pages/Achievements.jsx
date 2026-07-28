import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements } = useApp()
  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).length
  const pct = ACHIEVEMENT_DEFS.length ? Math.round((unlockedCount / ACHIEVEMENT_DEFS.length) * 100) : 0

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div>
          <h2>Achievements</h2>
          <p className="page-desc">Unlock badges as you build study habits and reach milestones.</p>
        </div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-row">
          <span className="ach-progress-count">{unlockedCount} / {ACHIEVEMENT_DEFS.length} unlocked</span>
          <span className="ach-progress-pct">{pct}%</span>
        </div>
        <div className="ach-progress-bar-wrap">
          <div className="ach-progress-bar" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="grid-3 ach-grid">
        {ACHIEVEMENT_DEFS.map(def => {
          const unlocked = unlockedKeys.has(def.key)
          return (
            <div key={def.key} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon-wrap">
                <span className="ach-icon">{def.icon}</span>
                {!unlocked && <span className="ach-lock">🔒</span>}
              </div>
              <h3 className="ach-title">{def.title}</h3>
              <p className="ach-desc">{def.desc}</p>
              <span className={`ach-status ${unlocked ? 'unlocked' : 'locked'}`}>{unlocked ? '✓ Unlocked' : 'Locked'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
