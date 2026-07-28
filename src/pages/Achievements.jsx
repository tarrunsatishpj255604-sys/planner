import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements } = useApp()
  const unlockedKeys = new Set(achievements.map(a => a.key))

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <p className="page-desc">Unlock achievements by completing tasks, studying, and maintaining streaks.</p>
      </div>

      <div className="ach-stats">
        <span className="ach-count">{achievements.length} / {ACHIEVEMENT_DEFS.length} unlocked</span>
        <div className="ach-progress">
          <div className="ach-progress-fill" style={{ width: `${(achievements.length / ACHIEVEMENT_DEFS.length) * 100}%` }} />
        </div>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map(a => {
          const unlocked = unlockedKeys.has(a.key)
          return (
            <div key={a.key} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <span className="ach-icon" style={{ filter: unlocked ? 'none' : 'grayscale(1) opacity(0.4)' }}>{a.icon}</span>
              <div className="ach-info">
                <span className="ach-title">{a.title}</span>
                <span className="ach-desc">{a.desc}</span>
                {unlocked ? <span className="ach-status unlocked">Unlocked</span> : <span className="ach-status locked">Locked</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
