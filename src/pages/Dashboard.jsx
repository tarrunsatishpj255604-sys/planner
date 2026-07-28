import { useState, useEffect, useMemo, useCallback } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { levelFromXp, getStreak, formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js';
import './Dashboard.css';

const QUOTES_FALLBACK = [
  'The secret of getting ahead is getting started.',
  'Believe you can and you’re halfway there.',
  'Success is the sum of small efforts repeated day in and day out.',
];

export default function Dashboard({ onNavigate }) {
  const {
    profile, subjects, tasks, quickNotes, sessions, exams, loading, refresh, addXp,
  } = useApp();

  const [quote, setQuote] = useState('');
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState([]);
  const [savingNote, setSavingNote] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('motivational_quotes')
          .select('text');
        if (!active) return;
        if (!error && data && data.length) {
          setQuote(data[Math.floor(Math.random() * data.length)].text);
        } else {
          setQuote(QUOTES_FALLBACK[Math.floor(Math.random() * QUOTES_FALLBACK.length)]);
        }
      } catch {
        if (active) setQuote(QUOTES_FALLBACK[0]);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => { setNotes(quickNotes || []); }, [quickNotes]);

  const today = todayStr();
  const todaySessions = useMemo(
    () => (sessions || []).filter(s => (s.date || s.created_at || '').slice(0, 10) === today),
    [sessions, today]
  );
  const studiedToday = useMemo(
    () => todaySessions.reduce((sum, s) => sum + (s.duration || 0), 0),
    [todaySessions]
  );
  const todayTasks = useMemo(
    () => (tasks || []).filter(t => (t.due_date || '').slice(0, 10) === today && !t.archived),
    [tasks, today]
  );
  const tasksDone = useMemo(
    () => todayTasks.filter(t => t.completed).length,
    [todayTasks]
  );
  const level = levelFromXp(profile?.xp || 0);
  const streak = getStreak(profile);

  const goal = profile?.daily_goal_minutes || 120;
  const goalPct = Math.min(100, Math.round((studiedToday / goal) * 100));
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (goalPct / 100) * circumference;

  const weeklyData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const total = (sessions || [])
        .filter(s => (s.date || s.created_at || '').slice(0, 10) === ds)
        .reduce((sum, s) => sum + (s.duration || 0), 0);
      days.push({ date: ds, label: d.toLocaleDateString(undefined, { weekday: 'short' }), total });
    }
    return days;
  }, [sessions]);
  const maxWeekly = Math.max(1, ...weeklyData.map(d => d.total));

  const upcomingExams = useMemo(
    () => (exams || [])
      .filter(e => (e.date || '') >= today)
      .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
      .slice(0, 3),
    [exams, today]
  );

  const toggleTask = useCallback(async (task) => {
    const next = !task.completed;
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ completed: next, completed_at: next ? new Date().toISOString() : null })
        .eq('id', task.id);
      if (error) throw error;
      if (next) await addXp(XP_REWARDS.task_complete || 15);
      refresh();
    } catch (e) {
      console.error('toggleTask', e);
    }
  }, [addXp, refresh]);

  const addNote = async () => {
    const text = newNote.trim();
    if (!text) return;
    setSavingNote(true);
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .insert({ content: text, created_at: new Date().toISOString() })
        .select();
      if (error) throw error;
      setNotes(prev => [...(data || []), ...prev].slice(0, 50));
      setNewNote('');
      refresh();
    } catch (e) {
      console.error('addNote', e);
    } finally {
      setSavingNote(false);
    }
  };

  const deleteNote = async (id) => {
    try {
      await supabase.from('quick_notes').delete().eq('id', id);
      setNotes(prev => prev.filter(n => n.id !== id));
      refresh();
    } catch (e) {
      console.error('deleteNote', e);
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="dashboard">
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome back, {profile?.username || 'Learner'} 👋</h1>
          <p>{streak > 0 ? `🔥 ${streak}-day streak — keep it going!` : 'Let’s start a new streak today!'}</p>
        </div>
        <div className="welcome-quote">{quote && <p>"{quote}"</p>}</div>
      </div>

      <div className="grid-4">
        <div className="card stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-value">{Math.round(studiedToday)}m</div>
          <div className="stat-label">Studied Today</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value">{tasksDone}/{todayTasks.length}</div>
          <div className="stat-label">Tasks Done</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">📚</div>
          <div className="stat-value">{(subjects || []).length}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-value">L{level.level}</div>
          <div className="stat-label">Level</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Today’s Tasks</h3></div>
          {todayTasks.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">📋</div><p>No tasks due today</p></div>
          ) : (
            <ul className="today-tasks">
              {todayTasks.map(t => (
                <li key={t.id} className={t.completed ? 'done' : ''}>
                  <label className="task-check">
                    <input type="checkbox" checked={!!t.completed} onChange={() => toggleTask(t)} />
                    <span></span>
                  </label>
                  <div className="task-info">
                    <div className="task-title">{t.title}</div>
                    <div className="task-meta">
                      {(subjects || []).find(s => s.id === t.subject_id)?.name && (
                        <span className="chip">{(subjects || []).find(s => s.id === t.subject_id)?.name}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card goal-card">
          <div className="card-head"><h3>Daily Goal</h3></div>
          <div className="goal-ring">
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="52" fill="none" stroke="var(--bg-3, #e5e7eb)" strokeWidth="10" />
              <circle
                cx="70" cy="70" r="52" fill="none" stroke="var(--primary, #6366f1)" strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                transform="rotate(-90 70 70)"
              />
              <text x="70" y="75" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">
                {goalPct}%
              </text>
            </svg>
            <p>{Math.round(studiedToday)} / {goal} min</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head"><h3>Quick Notes</h3></div>
          <div className="quick-note-add">
            <input
              type="text"
              placeholder="Jot a quick note..."
              value={newNote}
              onChange={e => setNewNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addNote()}
            />
            <button className="btn btn-primary btn-sm" onClick={addNote} disabled={savingNote}>Add</button>
          </div>
          <ul className="quick-note-list">
            {notes.length === 0 && <li className="empty-state"><p>No notes yet</p></li>}
            {notes.map(n => (
              <li key={n.id}>
                <span>{n.content}</span>
                <button className="close-btn" onClick={() => deleteNote(n.id)}>×</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="card xp-card">
          <div className="card-head"><h3>Level {level.level}</h3></div>
          <div className="xp-progress">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${level.progress}%` }} />
            </div>
            <div className="xp-text">{profile?.xp || 0} XP · {level.xpForNext} to next level</div>
          </div>
          <button className="btn btn-outline" onClick={() => onNavigate && onNavigate('focus')}>
            🎯 Start Focus Session
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>This Week</h3></div>
        <div className="weekly-chart">
          {weeklyData.map(d => (
            <div className="weekly-bar" key={d.date}>
              <div className="bar-wrap">
                <div className="bar" style={{ height: `${(d.total / maxWeekly) * 100}%` }} title={`${d.total}m`} />
              </div>
              <div className="bar-label">{d.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Upcoming Exams</h3></div>
        {upcomingExams.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📝</div><p>No upcoming exams</p></div>
        ) : (
          <ul className="exam-list">
            {upcomingExams.map(e => {
              const subj = (subjects || []).find(s => s.id === e.subject_id);
              return (
                <li key={e.id}>
                  <span className="exam-dot" style={{ background: subj?.color || '#999' }} />
                  <span className="exam-title">{e.title}</span>
                  <span className="exam-date">{formatDate(e.date)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
