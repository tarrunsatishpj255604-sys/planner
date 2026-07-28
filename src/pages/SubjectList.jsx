import { useState, useMemo } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { SUBJECT_ICONS, SUBJECT_COLORS } from '../lib/helpers.js';
import './SubjectList.css';

export default function SubjectList({ onNavigate }) {
  const { profile, subjects, tasks, sessions, refresh } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', icon: SUBJECT_ICONS[0], color: SUBJECT_COLORS[0], target_grade: '' });
  const [saving, setSaving] = useState(false);

  const stats = useMemo(() => {
    const map = {};
    (subjects || []).forEach(s => {
      const subjTasks = (tasks || []).filter(t => t.subject_id === s.id);
      const done = subjTasks.filter(t => t.completed).length;
      const total = subjTasks.length;
      const time = (sessions || [])
        .filter(sess => sess.subject_id === s.id)
        .reduce((sum, sess) => sum + (sess.duration || 0), 0);
      map[s.id] = { done, total, time };
    });
    return map;
  }, [subjects, tasks, sessions]);

  const create = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('subjects').insert({
        name: form.name.trim(),
        icon: form.icon,
        color: form.color,
        target_grade: form.target_grade || null,
        user_id: profile?.id,
      });
      if (error) throw error;
      setForm({ name: '', icon: SUBJECT_ICONS[0], color: SUBJECT_COLORS[0], target_grade: '' });
      setShowForm(false);
      refresh();
    } catch (e) {
      console.error('create subject', e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Delete this subject and all its data?')) return;
    try {
      await supabase.from('subjects').delete().eq('id', id);
      refresh();
    } catch (e) { console.error('delete subject', e); }
  };

  return (
    <div className="subject-list-page">
      <div className="page-toolbar">
        <div>
          <h2>Subjects</h2>
          <p className="page-desc">Manage your courses and track progress</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? 'Cancel' : '+ Add Subject'}
        </button>
      </div>

      {showForm && (
        <div className="card form-card">
          <div className="form-field">
            <label>Name</label>
            <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Biology" />
          </div>
          <div className="form-field">
            <label>Icon</label>
            <div className="icon-picker">
              {SUBJECT_ICONS.map(ic => (
                <button
                  key={ic}
                  type="button"
                  className={`icon-opt ${form.icon === ic ? 'active' : ''}`}
                  onClick={() => setForm(f => ({ ...f, icon: ic }))}
                >{ic}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Color</label>
            <div className="color-picker">
              {SUBJECT_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={`color-swatch ${form.color === c ? 'active' : ''}`}
                  style={{ background: c }}
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                />
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Target Grade</label>
            <input type="text" value={form.target_grade} onChange={e => setForm(f => ({ ...f, target_grade: e.target.value }))} placeholder="A" />
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={create} disabled={saving}>Save</button>
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {(subjects || []).length === 0 ? (
        <div className="card empty-state">
          <div className="empty-icon">📚</div>
          <p>No subjects yet. Add one to get started!</p>
        </div>
      ) : (
        <div className="grid-3">
          {(subjects || []).map(s => {
            const st = stats[s.id] || { done: 0, total: 0, time: 0 };
            const pct = st.total ? Math.round((st.done / st.total) * 100) : 0;
            return (
              <div
                key={s.id}
                className="card subject-card"
                onClick={() => onNavigate && onNavigate('subject-detail', s.id)}
              >
                <div className="subject-card-head" style={{ background: s.color || '#999' }}>
                  <span className="subject-icon">{s.icon || '📘'}</span>
                  <button
                    className="close-btn"
                    onClick={(e) => { e.stopPropagation(); remove(s.id); }}
                  >×</button>
                </div>
                <div className="subject-card-body">
                  <h3>{s.name}</h3>
                  {s.target_grade && <div className="subject-grade">Target: {s.target_grade}</div>}
                  <div className="subject-time">⏱️ {Math.round(st.time)}m studied</div>
                  <div className="subject-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: s.color }} />
                    </div>
                    <span className="progress-text">{st.done}/{st.total} tasks</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
