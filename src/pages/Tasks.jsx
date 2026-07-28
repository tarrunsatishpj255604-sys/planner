import { useState, useMemo } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { PRIORITY_CONFIG, DIFFICULTY_CONFIG, XP_REWARDS, formatDate, todayStr } from '../lib/helpers.js';
import './TasksPage.css';

const FILTERS = ['all', 'pending', 'completed', 'archived'];

export default function Tasks() {
  const { profile, subjects, tasks, refresh, addXp } = useApp();
  const [filter, setFilter] = useState('all');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());

  function emptyForm() {
    return { title: '', description: '', subject_id: '', due_date: todayStr(), priority: 'medium', difficulty: 'medium' };
  }

  const filtered = useMemo(() => {
    return (tasks || []).filter(t => {
      if (filter === 'all') return !t.archived;
      if (filter === 'pending') return !t.completed && !t.archived;
      if (filter === 'completed') return t.completed && !t.archived;
      if (filter === 'archived') return t.archived;
      return true;
    }).sort((a, b) => (a.due_date || '').localeCompare(b.due_date || ''));
  }, [tasks, filter]);

  const submit = async () => {
    if (!form.title.trim()) return;
    try {
      if (editing) {
        await supabase.from('tasks').update({
          title: form.title.trim(), description: form.description, subject_id: form.subject_id || null,
          due_date: form.due_date, priority: form.priority, difficulty: form.difficulty,
        }).eq('id', editing);
      } else {
        await supabase.from('tasks').insert({
          title: form.title.trim(), description: form.description, subject_id: form.subject_id || null,
          due_date: form.due_date, priority: form.priority, difficulty: form.difficulty,
          completed: false, archived: false, created_at: new Date().toISOString(),
        });
      }
      setForm(emptyForm()); setEditing(null); refresh();
    } catch (e) { console.error(e); }
  };

  const toggle = async (t) => {
    try {
      await supabase.from('tasks').update({ completed: !t.completed, completed_at: !t.completed ? new Date().toISOString() : null }).eq('id', t.id);
      if (!t.completed) await addXp(XP_REWARDS.task_complete || 15);
      refresh();
    } catch (e) { console.error(e); }
  };

  const archive = async (t) => {
    try { await supabase.from('tasks').update({ archived: !t.archived }).eq('id', t.id); refresh(); } catch (e) { console.error(e); }
  };

  const del = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await supabase.from('tasks').delete().eq('id', id); refresh(); } catch (e) { console.error(e); }
  };

  const edit = (t) => {
    setEditing(t.id);
    setForm({ title: t.title || '', description: t.description || '', subject_id: t.subject_id || '', due_date: t.due_date || todayStr(), priority: t.priority || 'medium', difficulty: t.difficulty || 'medium' });
  };

  return (
    <div className="tasks-page">
      <div className="page-toolbar">
        <div><h2>Tasks</h2><p className="page-desc">Manage your assignments and to-dos</p></div>
      </div>

      <div className="card form-card">
        <div className="form-field">
          <label>Title</label>
          <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="What do you need to do?" />
        </div>
        <div className="form-field">
          <label>Description</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Subject</label>
            <select value={form.subject_id} onChange={e => setForm(f => ({ ...f, subject_id: e.target.value }))}>
              <option value="">None</option>
              {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-field">
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Priority</label>
            <div className="seg-pick">
              {Object.keys(PRIORITY_CONFIG).map(p => (
                <button key={p} type="button" className={`seg-btn ${form.priority === p ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, priority: p }))}>{PRIORITY_CONFIG[p].label}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label>Difficulty</label>
            <div className="seg-pick">
              {Object.keys(DIFFICULTY_CONFIG).map(d => (
                <button key={d} type="button" className={`seg-btn ${form.difficulty === d ? 'active' : ''}`} onClick={() => setForm(f => ({ ...f, difficulty: d }))}>{DIFFICULTY_CONFIG[d].label}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" onClick={submit}>{editing ? 'Update' : 'Add'} Task</button>
          {editing && <button className="btn btn-ghost" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Cancel</button>}
        </div>
      </div>

      <div className="filter-chips">
        {FILTERS.map(f => (
          <button key={f} className={`filter-chip ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card empty-state"><div className="empty-icon">✅</div><p>No tasks here</p></div>
      ) : (
        <ul className="task-list">
          {filtered.map(t => {
            const subj = (subjects || []).find(s => s.id === t.subject_id);
            const pr = PRIORITY_CONFIG[t.priority] || {};
            const df = DIFFICULTY_CONFIG[t.difficulty] || {};
            return (
              <li key={t.id} className={`task-item ${t.completed ? 'done' : ''}`}>
                <label className="task-check"><input type="checkbox" checked={!!t.completed} onChange={() => toggle(t)} /><span></span></label>
                <div className="task-body">
                  <div className="task-title">{t.title}</div>
                  {t.description && <div className="task-desc">{t.description}</div>}
                  <div className="task-chips">
                    {subj && <span className="chip" style={{ background: subj.color || '#999', color: '#fff' }}>{subj.name}</span>}
                    {t.due_date && <span className="chip">{formatDate(t.due_date)}</span>}
                    {pr.label && <span className="chip" style={{ background: pr.color, color: '#fff' }}>{pr.label}</span>}
                    {df.label && <span className="chip">{df.label}</span>}
                  </div>
                </div>
                <div className="task-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => edit(t)}>Edit</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => archive(t)}>{t.archived ? 'Unarchive' : 'Archive'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => del(t.id)}>Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
