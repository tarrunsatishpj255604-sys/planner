import { useApp } from '../lib/AppContext.jsx'
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './AchievementsPage.css'

export default function Achievements() {
  const { achievements, loading } = useApp()
  const unlockedKeys = new Set((achievements || []).map(a => a.key))
  const unlockedCount = ACHIEVEMENT_DEFS.filter(d => unlockedKeys.has(d.key)).length
  const total = ACHIEVEMENT_DEFS.length
  const progress = total > 0 ? (unlockedCount / total) * 100 : 0

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  return (
    <div className="achievements-page">
      <div className="page-toolbar"><div><h2>Achievements</h2><p className="page-desc">Unlock badges as you study and progress.</p></div></div>

      <div className="card ach-progress-card">
        <div className="ach-progress-header"><h3>Progress</h3><span className="ach-progress-count">{unlockedCount} / {total}</span></div>
        <div className="ach-progress-bar"><div className="ach-progress-fill" style={{ width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary), var(--accent))' }} /></div>
      </div>

      <div className="grid-3 ach-grid">
        {ACHIEVEMENT_DEFS.map(def => {
          const unlocked = unlockedKeys.has(def.key)
          return (
            <div key={def.key} className={`card ach-card ${unlocked ? 'unlocked' : 'locked'}`}>
              <div className="ach-icon" style={unlocked ? { background: 'var(--primary-l)' } : { background: 'var(--surface-2)' }}>{unlocked ? def.icon : '🔒'}</div>
              <div className="ach-info">
                <span className="ach-title">{def.title}</span>
                <span className="ach-desc">{def.desc}</span>
                {unlocked ? <span className="ach-status unlocked">✓ Unlocked</span> : <span className="ach-status locked">Locked</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
