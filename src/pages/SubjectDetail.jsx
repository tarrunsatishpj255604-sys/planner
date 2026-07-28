import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, sessions, tasks, notes, flashcards, exams, loading, refresh, addXp, unlockAchievement } = useApp()
  const [tab, setTab] = useState('Overview')
  const subject = subjects.find(s => s.id === subjectId)

  // form states
  const [noteText, setNoteText] = useState('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [chapterName, setChapterName] = useState('')
  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])

  const subjectSessions = useMemo(() => sessions.filter(s => s.subject_id === subjectId), [sessions, subjectId])
  const subjectTasks = useMemo(() => tasks.filter(t => t.subject_id === subjectId), [tasks, subjectId])
  const subjectNotes = useMemo(() => notes.filter(n => n.subject_id === subjectId), [notes, subjectId])
  const subjectFlashcards = useMemo(() => flashcards.filter(f => f.subject_id === subjectId), [flashcards, subjectId])
  const subjectExams = useMemo(() => exams.filter(e => e.subject_id === subjectId), [exams, subjectId])
  const totalTime = subjectSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedTasks = subjectTasks.filter(t => t.completed).length
  const progress = subjectTasks.length > 0 ? completedTasks / subjectTasks.length : 0

  const addNote = async () => {
    if (!noteText.trim()) return
    await supabase.from('notes').insert({ title: noteText.trim().slice(0, 50), content: noteText.trim(), subject_id: subjectId, folder: 'General' })
    setNoteText(''); refresh()
  }
  const delNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }

  const addFlashcard = async () => {
    if (!fcFront.trim()) return
    await supabase.from('flashcards').insert({ front: fcFront.trim(), back: fcBack.trim(), subject_id: subjectId, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    setFcFront(''); setFcBack(''); refresh()
  }
  const delFlashcard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    await supabase.from('tasks').insert({ title: taskTitle.trim(), subject_id: subjectId, due_date: taskDue || null, priority: 'medium' })
    setTaskTitle(''); setTaskDue(''); refresh()
  }
  const toggleTask = async (t) => {
    if (t.completed) { await supabase.from('tasks').update({ completed: false, completed_at: null }).eq('id', t.id) }
    else { await supabase.from('tasks').update({ completed: true, completed_at: new Date().toISOString() }).eq('id', t.id); await addXp(XP_REWARDS.task_complete); await unlockAchievement('first_task') }
    refresh()
  }
  const delTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }

  const addExam = async () => {
    if (!examTitle.trim() || !examDate) return
    await supabase.from('exams').insert({ title: examTitle.trim(), subject_id: subjectId, exam_date: examDate })
    setExamTitle(''); setExamDate(''); refresh()
  }
  const delExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }

  const addResource = () => {
    if (!resourceName.trim()) return
    setResources([...resources, { id: Date.now(), name: resourceName.trim(), url: resourceUrl.trim() }])
    setResourceName(''); setResourceUrl('')
  }
  const delResource = (id) => setResources(resources.filter(r => r.id !== id))

  const addChapter = () => {
    if (!chapterName.trim()) return
    setChapters([...chapters, { id: Date.now(), name: chapterName.trim(), done: false }])
    setChapterName('')
  }
  const toggleChapter = (id) => setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const delChapter = (id) => setChapters(chapters.filter(c => c.id !== id))

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>
  if (!subject) return <div className="empty-state"><h3>Subject not found</h3><button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to Subjects</button></div>

  const R = 52, C = 2 * Math.PI * R
  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="btn btn-ghost btn-sm sd-back" onClick={() => onNavigate('subjects')} style={{ color: '#fff' }}>← Back</button>
        <div className="sd-header-info">
          <span className="sd-header-icon">{subject.icon || '📘'}</span>
          <div>
            <h2>{subject.name}</h2>
            <div className="sd-header-stats">
              <span>⏱️ {Math.floor(totalTime / 60)}h {totalTime % 60}m</span>
              <span>📋 {subjectTasks.length} tasks</span>
              <span>🃏 {subjectFlashcards.length} cards</span>
            </div>
          </div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>Progress</h3></div>
              <div className="sd-goal-ring">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={R} fill="none" stroke="var(--border)" strokeWidth="10" />
                  <circle cx="70" cy="70" r={R} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - progress)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="sd-goal-center"><span className="sd-goal-pct">{Math.round(progress * 100)}%</span><span className="sd-goal-detail">{completedTasks}/{subjectTasks.length} done</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Quick Stats</h3></div>
              <div className="sd-stat-list">
                <div className="sd-stat-row"><span>Total Study Time</span><strong>{Math.floor(totalTime / 60)}h {totalTime % 60}m</strong></div>
                <div className="sd-stat-row"><span>Tasks Completed</span><strong>{completedTasks}/{subjectTasks.length}</strong></div>
                <div className="sd-stat-row"><span>Flashcards</span><strong>{subjectFlashcards.length}</strong></div>
                <div className="sd-stat-row"><span>Notes</span><strong>{subjectNotes.length}</strong></div>
                <div className="sd-stat-row"><span>Exams</span><strong>{subjectExams.length}</strong></div>
                <div className="sd-stat-row"><span>Sessions</span><strong>{subjectSessions.length}</strong></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'Notes' && (
          <div className="card">
            <div className="card-head"><h3>Notes</h3></div>
            <div className="sd-form-inline">
              <textarea placeholder="Write a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows="3" />
              <button className="btn btn-primary" onClick={addNote}>Add Note</button>
            </div>
            {subjectNotes.length === 0 ? <div className="dash-empty">No notes for this subject yet.</div> : (
              <div className="sd-list">
                {subjectNotes.map(n => (
                  <div key={n.id} className="sd-list-item">
                    <div><strong>{n.title}</strong><p className="sd-list-desc">{n.content}</p></div>
                    <button className="sd-del-btn" onClick={() => delNote(n.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Flashcards' && (
          <div className="card">
            <div className="card-head"><h3>Flashcards</h3></div>
            <div className="sd-fc-form">
              <input placeholder="Front" value={fcFront} onChange={e => setFcFront(e.target.value)} />
              <input placeholder="Back" value={fcBack} onChange={e => setFcBack(e.target.value)} />
              <button className="btn btn-primary" onClick={addFlashcard}>Add</button>
            </div>
            {subjectFlashcards.length === 0 ? <div className="dash-empty">No flashcards yet.</div> : (
              <div className="sd-fc-grid">
                {subjectFlashcards.map(f => (
                  <div key={f.id} className="sd-fc-card">
                    <div className="sd-fc-front">{f.front}</div>
                    <div className="sd-fc-back">{f.back}</div>
                    <button className="sd-del-btn" onClick={() => delFlashcard(f.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Assignments' && (
          <div className="card">
            <div className="card-head"><h3>Assignments</h3></div>
            <div className="sd-form-inline">
              <input placeholder="Task title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} />
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} />
              <button className="btn btn-primary" onClick={addTask}>Add</button>
            </div>
            {subjectTasks.length === 0 ? <div className="dash-empty">No assignments yet.</div> : (
              <div className="sd-list">
                {subjectTasks.map(t => (
                  <div key={t.id} className="sd-list-item">
                    <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                    <div><span className={t.completed ? 'sd-task-done' : ''}>{t.title}</span>{t.due_date && <span className="sd-list-sub">Due {t.due_date}</span>}</div>
                    <button className="sd-del-btn" onClick={() => delTask(t.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Exams' && (
          <div className="card">
            <div className="card-head"><h3>Exams</h3></div>
            <div className="sd-form-inline">
              <input placeholder="Exam title" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              <button className="btn btn-primary" onClick={addExam}>Add</button>
            </div>
            {subjectExams.length === 0 ? <div className="dash-empty">No exams scheduled.</div> : (
              <div className="sd-list">
                {subjectExams.map(e => (
                  <div key={e.id} className="sd-list-item">
                    <div><strong>{e.title}</strong><span className="sd-list-sub">{e.exam_date}</span></div>
                    <button className="sd-del-btn" onClick={() => delExam(e.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Resources' && (
          <div className="card">
            <div className="card-head"><h3>Resources</h3></div>
            <div className="sd-form-inline">
              <input placeholder="Resource name" value={resourceName} onChange={e => setResourceName(e.target.value)} />
              <input placeholder="URL (optional)" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} />
              <button className="btn btn-primary" onClick={addResource}>Add</button>
            </div>
            {resources.length === 0 ? <div className="dash-empty">No resources added.</div> : (
              <div className="sd-list">
                {resources.map(r => (
                  <div key={r.id} className="sd-list-item">
                    <div><strong>{r.name}</strong>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="sd-list-sub">{r.url}</a>}</div>
                    <button className="sd-del-btn" onClick={() => delResource(r.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Chapters' && (
          <div className="card">
            <div className="card-head"><h3>Chapters</h3></div>
            <div className="sd-form-inline">
              <input placeholder="Chapter name" value={chapterName} onChange={e => setChapterName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChapter()} />
              <button className="btn btn-primary" onClick={addChapter}>Add</button>
            </div>
            {chapters.length === 0 ? <div className="dash-empty">No chapters yet.</div> : (
              <div className="sd-list">
                {chapters.map(c => (
                  <div key={c.id} className="sd-list-item">
                    <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggleChapter(c.id)} style={c.done ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                    <span className={c.done ? 'sd-task-done' : ''}>{c.name}</span>
                    <button className="sd-del-btn" onClick={() => delChapter(c.id)}>✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'Time Spent' && (
          <div className="card">
            <div className="card-head"><h3>Time Spent</h3></div>
            <div className="sd-total-time" style={{ color: subject.color }}>{Math.floor(totalTime / 60)}h {totalTime % 60}m</div>
            <p className="sd-total-label">Total study time</p>
            {subjectSessions.length === 0 ? <div className="dash-empty">No sessions logged yet.</div> : (
              <div className="sd-list">
                {subjectSessions.map(s => (
                  <div key={s.id} className="sd-list-item">
                    <div><strong>{s.duration_minutes} min</strong><span className="sd-list-sub">{s.session_date}{s.notes ? ` · ${s.notes}` : ''}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
