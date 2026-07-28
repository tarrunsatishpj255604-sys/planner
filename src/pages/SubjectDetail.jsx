import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS } from '../lib/helpers.js'
import './SubjectDetail.css'

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, refresh, addXp } = useApp()
  const subject = subjects.find(s => s.id === subjectId)
  const [tab, setTab] = useState('overview')
  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])

  // form states
  const [noteText, setNoteText] = useState('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [resName, setResName] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [chapterName, setChapterName] = useState('')

  const subTasks = useMemo(() => tasks.filter(t => t.subject_id === subjectId), [tasks, subjectId])
  const subNotes = useMemo(() => notes.filter(n => n.subject_id === subjectId), [notes, subjectId])
  const subFlashcards = useMemo(() => flashcards.filter(f => f.subject_id === subjectId), [flashcards, subjectId])
  const subExams = useMemo(() => exams.filter(e => e.subject_id === subjectId), [exams, subjectId])
  const subSessions = useMemo(() => sessions.filter(s => s.subject_id === subjectId), [sessions, subjectId])

  const totalMins = subSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const taskPct = subTasks.length ? Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100) : 0

  if (!subject) return <div className="empty-state"><h3>Subject not found</h3><button className="btn btn-primary" onClick={() => onNavigate?.('subjects')}>Back</button></div>

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'notes', label: 'Notes' },
    { key: 'flashcards', label: 'Flashcards' },
    { key: 'assignments', label: 'Assignments' },
    { key: 'exams', label: 'Exams' },
    { key: 'resources', label: 'Resources' },
    { key: 'chapters', label: 'Chapters' },
    { key: 'time', label: 'Time Spent' },
  ]

  const addNote = async () => {
    if (!noteText.trim()) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('notes').insert({ user_id: u.user.id, subject_id: subjectId, title: 'Note', content: noteText })
    setNoteText(''); refresh()
  }
  const delNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }

  const addFc = async () => {
    if (!fcFront.trim() || !fcBack.trim()) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('flashcards').insert({ user_id: u.user.id, subject_id: subjectId, front: fcFront, back: fcBack })
    setFcFront(''); setFcBack(''); refresh()
  }
  const delFc = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('tasks').insert({ user_id: u.user.id, subject_id: subjectId, title: taskTitle })
    setTaskTitle(''); refresh()
  }
  const toggleTask = async (t) => {
    const completed = !t.completed
    await supabase.from('tasks').update({ completed, completed_at: completed ? new Date().toISOString() : null }).eq('id', t.id)
    if (completed) await addXp(XP_REWARDS.task_complete)
    refresh()
  }
  const delTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const addExam = async () => {
    if (!examTitle.trim() || !examDate) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('exams').insert({ user_id: u.user.id, subject_id: subjectId, title: examTitle, exam_date: examDate })
    setExamTitle(''); setExamDate(''); refresh()
  }
  const delExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }

  const addResource = () => {
    if (!resName.trim()) return
    setResources([...resources, { id: Date.now(), name: resName, url: resUrl }])
    setResName(''); setResUrl('')
  }
  const delResource = (id) => setResources(resources.filter(r => r.id !== id))

  const addChapter = () => {
    if (!chapterName.trim()) return
    setChapters([...chapters, { id: Date.now(), name: chapterName, done: false }])
    setChapterName('')
  }
  const toggleChapter = (id) => setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const delChapter = (id) => setChapters(chapters.filter(c => c.id !== id))

  const ringR = 54, ringC = 2 * Math.PI * ringR

  return (
    <div className="subject-detail-page">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}aa)` }}>
        <button className="btn btn-ghost sd-back" onClick={() => onNavigate?.('subjects')}>← Back</button>
        <div className="sd-header-info">
          <span className="sd-icon">{subject.icon}</span>
          <h1>{subject.name}</h1>
        </div>
        <div className="sd-quick-stats">
          <div className="sd-qs"><span className="sd-qs-val">{Math.floor(totalMins / 60)}h {totalMins % 60}m</span><span className="sd-qs-label">Time</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subTasks.filter(t => t.completed).length}/{subTasks.length}</span><span className="sd-qs-label">Tasks</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subFlashcards.length}</span><span className="sd-qs-label">Cards</span></div>
        </div>
      </div>

      <div className="sd-tabs">
        {tabs.map(t => (
          <button key={t.key} className={`sd-tab ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>

      <div className="sd-content">
        {tab === 'overview' && (
          <div className="grid-2">
            <div className="card sd-overview-ring">
              <div className="card-head"><h3>Progress</h3></div>
              <div className="sd-ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={ringC} strokeDashoffset={ringC - (ringC * taskPct / 100)}
                    transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                  <text x="70" y="72" textAnchor="middle" dominantBaseline="middle" className="sd-ring-text">{taskPct}%</text>
                </svg>
                <div><div className="sd-stat-val">{Math.floor(totalMins / 60)}h {totalMins % 60}m</div><div className="sd-stat-label">Total study time</div></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Quick Stats</h3></div>
              <div className="sd-stat-row"><span>📝 Notes</span><strong>{subNotes.length}</strong></div>
              <div className="sd-stat-row"><span>🎴 Flashcards</span><strong>{subFlashcards.length}</strong></div>
              <div className="sd-stat-row"><span>✅ Tasks</span><strong>{subTasks.filter(t => t.completed).length}/{subTasks.length}</strong></div>
              <div className="sd-stat-row"><span>📋 Exams</span><strong>{subExams.length}</strong></div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="card">
            <div className="sd-add-row">
              <input className="sd-input" placeholder="Write a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addNote}>Add</button>
            </div>
            <div className="sd-list">
              {subNotes.length === 0 ? <div className="dash-empty">No notes yet.</div> :
                subNotes.map(n => (
                  <div key={n.id} className="sd-list-item">
                    <div className="sd-list-body">{n.content || n.title}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delNote(n.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'flashcards' && (
          <div className="card">
            <div className="sd-add-row sd-add-row-2">
              <input className="sd-input" placeholder="Front" value={fcFront} onChange={(e) => setFcFront(e.target.value)} />
              <input className="sd-input" placeholder="Back" value={fcBack} onChange={(e) => setFcBack(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addFc}>Add</button>
            </div>
            <div className="fc-grid">
              {subFlashcards.length === 0 ? <div className="dash-empty">No flashcards yet.</div> :
                subFlashcards.map(f => (
                  <div key={f.id} className="fc-mini-card">
                    <div className="fc-mini-front">{f.front}</div>
                    <div className="fc-mini-back">{f.back}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delFc(f.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'assignments' && (
          <div className="card">
            <div className="sd-add-row">
              <input className="sd-input" placeholder="New assignment..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addTask}>Add</button>
            </div>
            <div className="sd-list">
              {subTasks.length === 0 ? <div className="dash-empty">No assignments yet.</div> :
                subTasks.map(t => (
                  <div key={t.id} className="sd-list-item">
                    <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)}>{t.completed && '✓'}</button>
                    <div className="sd-list-body">{t.title}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delTask(t.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'exams' && (
          <div className="card">
            <div className="sd-add-row sd-add-row-2">
              <input className="sd-input" placeholder="Exam title" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
              <input type="date" className="sd-input" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addExam}>Add</button>
            </div>
            <div className="sd-list">
              {subExams.length === 0 ? <div className="dash-empty">No exams scheduled.</div> :
                subExams.map(e => (
                  <div key={e.id} className="sd-list-item">
                    <div className="sd-list-body">{e.title} <span className="sd-exam-date">{e.exam_date}</span></div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delExam(e.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'resources' && (
          <div className="card">
            <div className="sd-add-row sd-add-row-2">
              <input className="sd-input" placeholder="Resource name" value={resName} onChange={(e) => setResName(e.target.value)} />
              <input className="sd-input" placeholder="URL (optional)" value={resUrl} onChange={(e) => setResUrl(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addResource}>Add</button>
            </div>
            <div className="sd-list">
              {resources.length === 0 ? <div className="dash-empty">No resources added.</div> :
                resources.map(r => (
                  <div key={r.id} className="sd-list-item">
                    <div className="sd-list-body">{r.url ? <a href={r.url} target="_blank" rel="noreferrer">{r.name}</a> : r.name}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delResource(r.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'chapters' && (
          <div className="card">
            <div className="sd-add-row">
              <input className="sd-input" placeholder="Chapter name" value={chapterName} onChange={(e) => setChapterName(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addChapter}>Add</button>
            </div>
            <div className="sd-list">
              {chapters.length === 0 ? <div className="dash-empty">No chapters yet.</div> :
                chapters.map(c => (
                  <div key={c.id} className="sd-list-item">
                    <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggleChapter(c.id)}>{c.done && '✓'}</button>
                    <div className="sd-list-body">{c.name}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => delChapter(c.id)}>🗑️</button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'time' && (
          <div className="card">
            <div className="card-head"><h3>Time Spent</h3></div>
            <div className="sd-total-time">{Math.floor(totalMins / 60)}h {totalMins % 60}m total</div>
            <div className="sd-list">
              {subSessions.length === 0 ? <div className="dash-empty">No sessions logged.</div> :
                subSessions.map(s => (
                  <div key={s.id} className="sd-list-item">
                    <div className="sd-list-body">{s.session_date} — {s.duration}m {s.mode ? `(${s.mode})` : ''}</div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
