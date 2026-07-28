import { useMemo } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { getStreak, todayStr } from '../lib/helpers.js';
import './AnalyticsPage.css';

export default function Analytics() {
  const { profile, subjects, tasks, sessions } = useApp();

  const totalTime = useMemo(() => (sessions || []).reduce((s, x) => s + (x.duration || 0), 0), [sessions]);
  const streak = getStreak(profile);
  const tasksDone = useMemo(() => (tasks || []).filter(t => t.completed).length, [tasks]);
  const completionRate = (tasks || []).length ? Math.round((tasksDone / tasks.length) * 100) : 0;

  const weekly = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const total = (sessions || []).filter(s => (s.date || s.created_at || '').slice(0, 10) === ds).reduce((sum, s) => sum + (s.duration || 0), 0);
      days.push({ label: d.toLocaleDateString(undefined, { weekday: 'short' }), total });
    }
    return days;
  }, [sessions]);
  const maxWeekly = Math.max(1, ...weekly.map(d => d.total));

  const heatmap = useMemo(() => {
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const total = (sessions || []).filter(s => (s.date || s.created_at || '').slice(0, 10) === ds).reduce((sum, s) => sum + (s.duration || 0), 0);
      cells.push({ date: ds, total });
    }
    return cells;
  }, [sessions]);
  const maxHeat = Math.max(1, ...heatmap.map(c => c.total));

  const subjectComparison = useMemo(() => {
    return (subjects || []).map(s => ({
      name: s.name, color: s.color,
      time: (sessions || []).filter(x => x.subject_id === s.id).reduce((sum, x) => sum + (x.duration || 0), 0),
    })).sort((a, b) => b.time - a.time);
  }, [subjects, sessions]);
  const maxSubj = Math.max(1, ...subjectComparison.map(s => s.time));

  return (
    <div className="analytics-page">
      <div className="page-toolbar"><div><h2>Analytics</h2><p className="page-desc">Track your study progress</p></div></div>

      <div className="grid-4">
        <div className="card stat-card"><div className="stat-icon">⏱️</div><div className="stat-value">{Math.round(totalTime)}m</div><div className="stat-label">Total Time</div></div>
        <div className="card stat-card"><div className="stat-icon">🔥</div><div className="stat-value">{streak}</div><div className="stat-label">Day Streak</div></div>
        <div className="card stat-card"><div className="stat-icon">✅</div><div className="stat-value">{tasksDone}</div><div className="stat-label">Tasks Done</div></div>
        <div className="card stat-card"><div className="stat-icon">📊</div><div className="stat-value">{completionRate}%</div><div className="stat-label">Completion</div></div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="weekly-chart">
          {weekly.map((d, i) => (
            <div className="weekly-bar" key={i}>
              <div className="bar-wrap"><div className="bar" style={{ height: `${(d.total / maxWeekly) * 100}%` }} title={`${d.total}m`} /></div>
              <div className="bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Last 30 Days</h3></div>
        <div className="heatmap">
          {heatmap.map((c, i) => (
            <div className="heat-cell" key={i}
              style={{ background: c.total === 0 ? 'var(--bg-3, #e5e7eb)' : `rgba(99,102,241,${0.3 + 0.7 * (c.total / maxHeat)})` }}
              title={`${c.date}: ${c.total}m`} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Subject Comparison</h3></div>
        {subjectComparison.length === 0 ? <div className="empty-state"><p>No data</p></div> : (
          <div className="subj-bars">
            {subjectComparison.map(s => (
              <div className="subj-bar-row" key={s.name}>
                <span className="subj-name">{s.name}</span>
                <div className="subj-bar-track"><div className="subj-bar-fill" style={{ width: `${(s.time / maxSubj) * 100}%`, background: s.color }} /></div>
                <span className="subj-time">{Math.round(s.time)}m</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
