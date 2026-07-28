import { useState, useEffect, useMemo } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { XP_REWARDS } from '../lib/helpers.js';
import './SubjectDetail.css';

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent'];

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { profile, subjects, tasks, notes, flashcards, sessions, exams, refresh, addXp } = useApp();
  const [tab, setTab] = useState('Overview');
  const [resources, setResources] = useState([]);
  const [chapters, setChapters] = useState([]);

  const subject = useMemo(() => (subjects || []).find(s => s.id === subjectId), [subjects, subjectId]);

  const subjNotes = useMemo(() => (notes || []).filter(n => n.subject_id === subjectId), [notes, subjectId]);
  const subjCards = useMemo(() => (flashcards || []).filter(f => f.subject_id === subjectId), [flashcards, subjectId]);
  const subjTasks = useMemo(() => (tasks || []).filter(t => t.subject_id === subjectId), [tasks, subjectId]);
  const subjExams = useMemo(() => (exams || []).filter(e => e.subject_id === subjectId), [exams, subjectId]);
  const subjSessions = useMemo(() => (sessions || []).filter(s => s.subject_id === subjectId), [sessions, subjectId]);

  const totalTime = useMemo(() => subjSessions.reduce((sum, s) => sum + (s.duration || 0), 0), [subjSessions]);
  const taskPct = subjTasks.length ? Math.round((subjTasks.filter(t => t.completed).length / subjTasks.length) * 100) : 0;

  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference - (taskPct / 100) * circumference;

  if (!subject) return <div className="empty-state"><div className="empty-icon">🔍</div><p>Subject not found</p></div>;

  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color || '#6366f1'}, ${subject.color || '#8b5cf6'})` }}>
        <button className="btn btn-ghost back-btn" onClick={() => onNavigate && onNavigate('subjects')}>← Back</button>
        <span className="sd-icon">{subject.icon || '📘'}</span>
        <div className="sd-title">
          <h1>{subject.name}</h1>
          {subject.target_grade && <span>Target: {subject.target_grade}</span>}
        </div>
        <div className="sd-quick-stats">
          <div><strong>{Math.round(totalTime)}m</strong><span>Studied</span></div>
          <div><strong>{subjTasks.filter(t => t.completed).length}/{subjTasks.length}</strong><span>Tasks</span></div>
          <div><strong>{subjCards.length}</strong><span>Cards</span></div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="grid-3">
            <div className="card">
              <div className="card-head"><h3>Progress</h3></div>
              <div className="ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="52" fill="none" stroke="var(--bg-3, #e5e7eb)" strokeWidth="10" />
                  <circle cx="70" cy="70" r="52" fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={dashOffset} transform="rotate(-90 70 70)" />
                  <text x="70" y="75" textAnchor="middle" fontSize="22" fontWeight="700" fill="currentColor">{taskPct}%</text>
                </svg>
              </div>
            </div>
            <div className="card"><div className="card-head"><h3>Time</h3></div><p className="big-stat">{Math.round(totalTime)} min</p></div>
            <div className="card"><div className="card-head"><h3>Flashcards</h3></div><p className="big-stat">{subjCards.length}</p></div>
          </div>
        )}
        {tab === 'Notes' && <NotesTab subjectId={subjectId} items={subjNotes} refresh={refresh} />}
        {tab === 'Flashcards' && <FlashcardsTab subjectId={subjectId} items={subjCards} refresh={refresh} addXp={addXp} />}
        {tab === 'Assignments' && <AssignmentsTab subjectId={subjectId} items={subjTasks} refresh={refresh} addXp={addXp} />}
        {tab === 'Exams' && <ExamsTab subjectId={subjectId} items={subjExams} refresh={refresh} />}
        {tab === 'Resources' && <ResourcesTab resources={resources} setResources={setResources} />}
        {tab === 'Chapters' && <ChaptersTab chapters={chapters} setChapters={setChapters} />}
        {tab === 'Time Spent' && (
          <div className="card">
            <div className="card-head"><h3>Total: {Math.round(totalTime)} min</h3></div>
            {subjSessions.length === 0 ? (
              <div className="empty-state"><p>No sessions logged</p></div>
            ) : (
              <ul className="session-list">
                {subjSessions.map(s => (
                  <li key={s.id}><span>{s.date || s.created_at}</span><span>{s.duration}m</span></li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NotesTab({ subjectId, items, refresh }) {
  const [text, setText] = useState('');
  const add = async () => {
    if (!text.trim()) return;
    try {
      await supabase.from('notes').insert({ subject_id: subjectId, content: text.trim(), title: text.trim().slice(0, 30), created_at: new Date().toISOString() });
      setText(''); refresh();
    } catch (e) { console.error(e); }
  };
  const del = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh(); };
  return (
    <div className="card">
      <div className="card-head"><h3>Notes</h3></div>
      <div className="inline-add"><input type="text" value={text} onChange={e => setText(e.target.value)} placeholder="New note..." onKeyDown={e => e.key === 'Enter' && add()} /><button className="btn btn-primary btn-sm" onClick={add}>Add</button></div>
      <ul className="item-list">
        {items.length === 0 && <li className="empty-state"><p>No notes</p></li>}
        {items.map(n => <li key={n.id}><span>{n.title || n.content}</span><button className="close-btn" onClick={() => del(n.id)}>×</button></li>)}
      </ul>
    </div>
  );
}

function FlashcardsTab({ subjectId, items, refresh, addXp }) {
  const [front, setFront] = useState(''); const [back, setBack] = useState('');
  const add = async () => {
    if (!front.trim() || !back.trim()) return;
    try {
      await supabase.from('flashcards').insert({ subject_id: subjectId, front: front.trim(), back: back.trim(), created_at: new Date().toISOString() });
      setFront(''); setBack(''); refresh(); addXp(XP_REWARDS.flashcard_create || 5);
    } catch (e) { console.error(e); }
  };
  const del = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh(); };
  return (
    <div className="card">
      <div className="card-head"><h3>Flashcards</h3></div>
      <div className="fc-add">
        <input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="Front" />
        <input type="text" value={back} onChange={e => setBack(e.target.value)} placeholder="Back" />
        <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
      </div>
      <div className="fc-grid">
        {items.length === 0 && <p className="empty-state">No cards</p>}
        {items.map(c => (
          <div className="fc-mini" key={c.id}>
            <div><strong>{c.front}</strong></div>
            <div className="muted">{c.back}</div>
            <button className="close-btn" onClick={() => del(c.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function AssignmentsTab({ subjectId, items, refresh, addXp }) {
  const [title, setTitle] = useState('');
  const add = async () => {
    if (!title.trim()) return;
    try { await supabase.from('tasks').insert({ subject_id: subjectId, title: title.trim(), completed: false, created_at: new Date().toISOString() }); setTitle(''); refresh(); } catch (e) { console.error(e); }
  };
  const toggle = async (t) => {
    try { await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id); if (!t.completed) addXp(XP_REWARDS.task_complete || 15); refresh(); } catch (e) { console.error(e); }
  };
  const del = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh(); };
  return (
    <div className="card">
      <div className="card-head"><h3>Assignments</h3></div>
      <div className="inline-add"><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="New task..." onKeyDown={e => e.key === 'Enter' && add()} /><button className="btn btn-primary btn-sm" onClick={add}>Add</button></div>
      <ul className="item-list">
        {items.length === 0 && <li className="empty-state"><p>No assignments</p></li>}
        {items.map(t => (
          <li key={t.id} className={t.completed ? 'done' : ''}>
            <label className="task-check"><input type="checkbox" checked={!!t.completed} onChange={() => toggle(t)} /><span></span></label>
            <span>{t.title}</span>
            <button className="close-btn" onClick={() => del(t.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExamsTab({ subjectId, items, refresh }) {
  const [title, setTitle] = useState(''); const [date, setDate] = useState('');
  const add = async () => {
    if (!title.trim() || !date) return;
    try { await supabase.from('exams').insert({ subject_id: subjectId, title: title.trim(), date }); setTitle(''); setDate(''); refresh(); } catch (e) { console.error(e); }
  };
  const del = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh(); };
  return (
    <div className="card">
      <div className="card-head"><h3>Exams</h3></div>
      <div className="inline-add">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Exam title" />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
      </div>
      <ul className="item-list">
        {items.length === 0 && <li className="empty-state"><p>No exams</p></li>}
        {items.map(e => <li key={e.id}><span>{e.title} — {e.date}</span><button className="close-btn" onClick={() => del(e.id)}>×</button></li>)}
      </ul>
    </div>
  );
}

function ResourcesTab({ resources, setResources }) {
  const [name, setName] = useState(''); const [url, setUrl] = useState('');
  const add = () => { if (!name.trim()) return; setResources(r => [...r, { id: Date.now(), name: name.trim(), url: url.trim() }]); setName(''); setUrl(''); };
  const del = (id) => setResources(r => r.filter(x => x.id !== id));
  return (
    <div className="card">
      <div className="card-head"><h3>Resources</h3></div>
      <div className="inline-add">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Resource name" />
        <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="URL (optional)" />
        <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
      </div>
      <ul className="item-list">
        {resources.length === 0 && <li className="empty-state"><p>No resources</p></li>}
        {resources.map(r => <li key={r.id}><span>{r.name}{r.url && <a href={r.url} target="_blank" rel="noreferrer"> ↗</a>}</span><button className="close-btn" onClick={() => del(r.id)}>×</button></li>)}
      </ul>
    </div>
  );
}

function ChaptersTab({ chapters, setChapters }) {
  const [title, setTitle] = useState('');
  const add = () => { if (!title.trim()) return; setChapters(c => [...c, { id: Date.now(), title: title.trim(), done: false }]); setTitle(''); };
  const toggle = (id) => setChapters(c => c.map(x => x.id === id ? { ...x, done: !x.done } : x));
  const del = (id) => setChapters(c => c.filter(x => x.id !== id));
  return (
    <div className="card">
      <div className="card-head"><h3>Chapters</h3></div>
      <div className="inline-add"><input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Chapter title" onKeyDown={e => e.key === 'Enter' && add()} /><button className="btn btn-primary btn-sm" onClick={add}>Add</button></div>
      <ul className="item-list">
        {chapters.length === 0 && <li className="empty-state"><p>No chapters</p></li>}
        {chapters.map(c => (
          <li key={c.id} className={c.done ? 'done' : ''}>
            <label className="task-check"><input type="checkbox" checked={c.done} onChange={() => toggle(c.id)} /><span></span></label>
            <span>{c.title}</span>
            <button className="close-btn" onClick={() => del(c.id)}>×</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
