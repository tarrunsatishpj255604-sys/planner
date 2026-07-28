import { useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements } = useApp()
  const unlockedKeys = useMemo(() => new Set(achievements.map(a => a.key)), [achievements])
  const unlockedCount = ACHIEVEMENT_DEFS.filter(a => unlockedKeys.has(a.key)).length
  const totalCount = ACHIEVEMENT_DEFS.length
  const progress = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0

  return (
    <div className="achievements-page">
      <div className="page-toolbar">
        <div>
          <h2>Achievements</h2>
          <p className="page-desc">Unlock badges by completing tasks, studying, and reaching milestones.</p>
        </div>
      </div>

      <div className="card ach-progress-card">
        <div className="ach-progress-top">
          <div className="ach-progress-info">
            <h3>{unlockedCount} / {totalCount} Unlocked</h3>
            <span>Keep studying to unlock more achievements!</span>
          </div>
          <span className="ach-progress-pct">{progress}%</span>
        </div>
        <div className="ach-progress-bar"><div className="ach-progress-fill" style={{ width: `${progress}%`, background: 'var(--primary)' }} /></div>
      </div>

      <div className="grid-3 ach-grid">
        {ACHIEVEMENT_DEFS.map(a => {
          const unlocked = unlockedKeys.has(a.key)
          return (
            <div key={a.key} className={`ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon" style={unlocked ? { background: 'var(--primary-l)' } : { background: 'var(--surface-2)' }}>{a.icon}</div>
              <div className="ach-info">
                <span className="ach-title">{a.title}</span>
                <span className="ach-desc">{a.desc}</span>
                {unlocked ? <span className="ach-status unlocked">✓ Unlocked</span> : <span className="ach-status locked">🔒 Locked</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
