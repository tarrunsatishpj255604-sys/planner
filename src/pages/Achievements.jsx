import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements } = useApp()
  const unlockedKeys = new Set(achievements.map(a => a.key))
  const unlockedCount = ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).length
  const pct = Math.round((unlockedCount / ACHIEVEMENT_DEFS.length) * 100)

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div><h2>Achievements</h2><p className="page-desc">Unlock badges as you progress through your study journey.</p></div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-top">
          <h3>{unlockedCount} / {ACHIEVEMENT_DEFS.length} Unlocked</h3>
          <span className="ach-progress-pct">{pct}%</span>
        </div>
        <div className="ach-progress-track"><div className="ach-progress-fill" style={{ width: `${pct}%` }} /></div>
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
                <div className="ach-title">{def.title}</div>
                <div className="ach-desc">{def.desc}</div>
              </div>
              {unlocked && <span className="ach-badge">✓</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
