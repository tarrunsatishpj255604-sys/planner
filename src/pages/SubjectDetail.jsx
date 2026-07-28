import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS, DIFFICULTY_CONFIG, PRIORITY_CONFIG, formatDate } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { user, subjects, tasks, notes, flashcards, sessions, exams, addXp, refresh } = useApp()
  const [tab, setTab] = useState('Overview')
  const subject = subjects.find(s => s.id === subjectId)

  const [noteText, setNoteText] = useState('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [resources, setResources] = useState([])
  const [resName, setResName] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [chapters, setChapters] = useState([])
  const [chapName, setChapName] = useState('')

  if (!subject) {
    return (
      <div className="empty-state">
        <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>🔍</div>
        <h3>Subject not found</h3>
        <button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to Subjects</button>
      </div>
    )
  }

  const subTasks = tasks.filter(t => t.subject_id === subjectId)
  const subNotes = notes.filter(n => n.subject_id === subjectId)
  const subFlashcards = flashcards.filter(f => f.subject_id === subjectId)
  const subExams = exams.filter(e => e.subject_id === subjectId)
  const subSessions = sessions.filter(s => s.subject_id === subjectId)
  const totalTime = subSessions.reduce((a, s) => a + (s.duration || 0), 0)
  const taskProgress = subTasks.length > 0 ? Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100) : 0

  const addNote = async () => {
    if (!noteText.trim()) return
    await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, title: noteText.trim().slice(0, 50), content: noteText.trim() })
    setNoteText(''); refresh()
  }
  const deleteNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }

  const addFlashcard = async () => {
    if (!fcFront.trim() || !fcBack.trim()) return
    await supabase.from('flashcards').insert({ user_id: user.id, subject_id: subjectId, front: fcFront.trim(), back: fcBack.trim() })
    setFcFront(''); setFcBack(''); refresh()
  }
  const deleteFlashcard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    await supabase.from('tasks').insert({ user_id: user.id, subject_id: subjectId, title: taskTitle.trim(), priority: 'medium', difficulty: 'medium' })
    setTaskTitle(''); refresh()
  }
  const toggleTask = async (task) => {
    const updates = { completed: !task.completed, completed_at: !task.completed ? new Date().toISOString() : null }
    await supabase.from('tasks').update(updates).eq('id', task.id)
    if (!task.completed) { const diff = DIFFICULTY_CONFIG[task.difficulty]?.xp || XP_REWARDS.task_complete; await addXp(diff) }
    refresh()
  }
  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const addExam = async () => {
    if (!examTitle.trim() || !examDate) return
    await supabase.from('exams').insert({ user_id: user.id, subject_id: subjectId, title: examTitle.trim(), exam_date: examDate })
    setExamTitle(''); setExamDate(''); refresh()
  }
  const deleteExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }

  const addResource = () => { if (!resName.trim()) return; setResources([...resources, { id: Date.now(), name: resName.trim(), url: resUrl.trim() }]); setResName(''); setResUrl('') }
  const deleteResource = (id) => setResources(resources.filter(r => r.id !== id))

  const addChapter = () => { if (!chapName.trim()) return; setChapters([...chapters, { id: Date.now(), name: chapName.trim(), done: false }]); setChapName('') }
  const toggleChapter = (id) => setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const deleteChapter = (id) => setChapters(chapters.filter(c => c.id !== id))

  const ringR = 52, ringC = 2 * Math.PI * ringR

  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="btn btn-sm sd-back" onClick={() => onNavigate('subjects')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="sd-header-info">
          <span className="sd-icon">{subject.icon || '📘'}</span>
          <div>
            <h1>{subject.name}</h1>
            {subject.target_grade && <span className="sd-grade">Target: {subject.target_grade}</span>}
          </div>
        </div>
        <div className="sd-quick-stats">
          <div className="sd-qs"><span className="sd-qs-val">{Math.round(totalTime)}m</span><span className="sd-qs-label">Studied</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subTasks.filter(t => t.completed).length}/{subTasks.length}</span><span className="sd-qs-label">Tasks</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subFlashcards.length}</span><span className="sd-qs-label">Cards</span></div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="grid-2 sd-overview">
            <div className="card">
              <div className="card-head"><h3>Progress</h3></div>
              <div className="sd-ring-wrap">
                <svg className="sd-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="60" cy="60" r={ringR} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={ringC} strokeDashoffset={ringC * (1 - taskProgress / 100)} transform="rotate(-90 60 60)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                </svg>
                <div className="sd-ring-text"><span className="sd-ring-pct">{taskProgress}%</span><span className="sd-ring-label">Tasks Done</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Quick Stats</h3></div>
              <div className="sd-stat-list">
                <div className="sd-stat-row"><span>Total Time</span><span className="sd-stat-val">{Math.round(totalTime)} min</span></div>
                <div className="sd-stat-row"><span>Flashcards</span><span className="sd-stat-val">{subFlashcards.length}</span></div>
                <div className="sd-stat-row"><span>Notes</span><span className="sd-stat-val">{subNotes.length}</span></div>
                <div className="sd-stat-row"><span>Exams</span><span className="sd-stat-val">{subExams.length}</span></div>
                <div className="sd-stat-row"><span>Sessions</span><span className="sd-stat-val">{subSessions.length}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Notes' && (
          <div className="card">
            <div className="card-head"><h3>Notes</h3></div>
            <div className="sd-add-row">
              <textarea className="sd-textarea" placeholder="Write a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={3} />
              <button className="btn btn-primary" onClick={addNote}>Add Note</button>
            </div>
            <div className="sd-list">
              {subNotes.length === 0 ? <p className="dash-empty">No notes yet.</p> : subNotes.map(n => (
                <div key={n.id} className="sd-note-item">
                  <div className="sd-note-body"><strong>{n.title}</strong><p>{n.content}</p></div>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteNote(n.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Flashcards' && (
          <div className="card">
            <div className="card-head"><h3>Flashcards</h3></div>
            <div className="sd-fc-form">
              <input className="sd-input" placeholder="Front" value={fcFront} onChange={e => setFcFront(e.target.value)} />
              <input className="sd-input" placeholder="Back" value={fcBack} onChange={e => setFcBack(e.target.value)} />
              <button className="btn btn-primary" onClick={addFlashcard}>Add</button>
            </div>
            <div className="sd-fc-grid">
              {subFlashcards.length === 0 ? <p className="dash-empty">No flashcards yet.</p> : subFlashcards.map(f => (
                <div key={f.id} className="sd-fc-card">
                  <div className="sd-fc-front">{f.front}</div>
                  <div className="sd-fc-back">{f.back}</div>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteFlashcard(f.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Assignments' && (
          <div className="card">
            <div className="card-head"><h3>Assignments</h3></div>
            <div className="sd-add-row">
              <input className="sd-input" placeholder="New task..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} />
              <button className="btn btn-primary" onClick={addTask}>Add</button>
            </div>
            <div className="sd-list">
              {subTasks.length === 0 ? <p className="dash-empty">No tasks yet.</p> : subTasks.map(t => (
                <div key={t.id} className="sd-task-item">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`sd-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                  {t.priority && <span className="sd-chip" style={{ background: PRIORITY_CONFIG[t.priority]?.bg, color: PRIORITY_CONFIG[t.priority]?.color }}>{PRIORITY_CONFIG[t.priority]?.label}</span>}
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteTask(t.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Exams' && (
          <div className="card">
            <div className="card-head"><h3>Exams</h3></div>
            <div className="sd-add-row">
              <input className="sd-input" placeholder="Exam title" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
              <input className="sd-input" type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              <button className="btn btn-primary" onClick={addExam}>Add</button>
            </div>
            <div className="sd-list">
              {subExams.length === 0 ? <p className="dash-empty">No exams scheduled.</p> : subExams.map(e => (
                <div key={e.id} className="sd-exam-item">
                  <div><strong>{e.title}</strong><span className="sd-exam-date">{formatDate(e.exam_date)}</span></div>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteExam(e.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Resources' && (
          <div className="card">
            <div className="card-head"><h3>Resources</h3></div>
            <div className="sd-add-row">
              <input className="sd-input" placeholder="Resource name" value={resName} onChange={e => setResName(e.target.value)} />
              <input className="sd-input" placeholder="URL (optional)" value={resUrl} onChange={e => setResUrl(e.target.value)} />
              <button className="btn btn-primary" onClick={addResource}>Add</button>
            </div>
            <div className="sd-list">
              {resources.length === 0 ? <p className="dash-empty">No resources added.</p> : resources.map(r => (
                <div key={r.id} className="sd-res-item">
                  <span>🔗 {r.name}{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="sd-res-link"> (link)</a>}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteResource(r.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Chapters' && (
          <div className="card">
            <div className="card-head"><h3>Chapters</h3></div>
            <div className="sd-add-row">
              <input className="sd-input" placeholder="Chapter name" value={chapName} onChange={e => setChapName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChapter()} />
              <button className="btn btn-primary" onClick={addChapter}>Add</button>
            </div>
            <div className="sd-list">
              {chapters.length === 0 ? <p className="dash-empty">No chapters yet.</p> : chapters.map(c => (
                <div key={c.id} className="sd-chap-item">
                  <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggleChapter(c.id)} style={c.done ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                    {c.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
                  </button>
                  <span className={`sd-chap-name ${c.done ? 'done' : ''}`}>{c.name}</span>
                  <button className="btn btn-sm btn-ghost" onClick={() => deleteChapter(c.id)}>🗑️</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Time Spent' && (
          <div className="card">
            <div className="card-head"><h3>Time Spent</h3></div>
            <div className="sd-total-time">
              <span className="sd-tt-val">{Math.round(totalTime / 60 * 10) / 10}h</span>
              <span className="sd-tt-label">Total ({Math.round(totalTime)} min)</span>
            </div>
            <div className="sd-session-list">
              <h4>Session History</h4>
              {subSessions.length === 0 ? <p className="dash-empty">No sessions logged yet.</p> : subSessions.map(s => (
                <div key={s.id} className="sd-session-item">
                  <span className="sd-sess-date">{formatDate(s.session_date)}</span>
                  <span className="sd-sess-dur">{s.duration} min</span>
                  {s.mode && <span className="sd-sess-mode">{s.mode}</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
