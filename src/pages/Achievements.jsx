import { useApp } from '../lib/AppContext.jsx';
import { ACHIEVEMENT_DEFS } from '../lib/helpers.js';
import './AchievementsPage.css';

export default function Achievements() {
  const { achievements } = useApp();
  const unlocked = achievements || [];
  const total = ACHIEVEMENT_DEFS.length;
  const count = unlocked.length;
  const pct = total ? Math.round((count / total) * 100) : 0;

  return (
    <div className="achievements-page">
      <div className="page-toolbar"><div><h2>Achievements</h2><p className="page-desc">{count} of {total} unlocked</p></div></div>

      <div className="card">
        <div className="ach-progress">
          <div className="ach-bar"><div className="ach-fill" style={{ width: `${pct}%` }} /></div>
          <span className="ach-count">{count} / {total}</span>
        </div>
      </div>

      <div className="ach-grid">
        {ACHIEVEMENT_DEFS.map(a => {
          const got = unlocked.includes(a.id);
          return (
            <div className={`card ach-card ${got ? 'unlocked' : 'locked'}`} key={a.id}>
              <div className="ach-icon">{got ? a.icon : '🔒'}</div>
              <div className="ach-name">{a.name}</div>
              <div className="ach-desc">{a.description}</div>
              <div className="ach-status">{got ? 'Unlocked' : 'Locked'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
