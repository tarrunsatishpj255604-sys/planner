import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, PRIORITY_CONFIG, DIFFICULTY_CONFIG } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, refresh, addXp } = useApp()
  const [tab, setTab] = useState('Overview')
  const subject = subjects.find(s => s.id === subjectId)

  const [noteTitle, setNoteTitle] = useState('')
  const [noteContent, setNoteContent] = useState('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDue, setTaskDue] = useState('')
  const [taskPriority, setTaskPriority] = useState('medium')
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [resourceUrl, setResourceUrl] = useState('')
  const [resourceName, setResourceName] = useState('')
  const [chapterName, setChapterName] = useState('')

  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])

  if (!subject) {
    return (
      <div className="empty-state">
        <h3>Subject not found</h3>
        <button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to subjects</button>
      </div>
    )
  }

  const subTasks = tasks.filter(t => t.subject_id === subjectId)
  const subNotes = notes.filter(n => n.subject_id === subjectId)
  const subFlashcards = flashcards.filter(f => f.subject_id === subjectId)
  const subSessions = sessions.filter(s => s.subject_id === subjectId)
  const subExams = exams.filter(e => e.subject_id === subjectId)
  const totalMin = subSessions.reduce((sum, s) => sum + s.duration_minutes, 0)
  const completedTasks = subTasks.filter(t => t.completed).length
  const taskPct = subTasks.length > 0 ? Math.round((completedTasks / subTasks.length) * 100) : 0

  const addNote = async () => {
    if (!noteTitle.trim()) return
    await supabase.from('notes').insert({ subject_id: subjectId, title: noteTitle.trim(), content: noteContent.trim() })
    setNoteTitle(''); setNoteContent(''); refresh()
  }

  const addFlashcard = async () => {
    if (!fcFront.trim() || !fcBack.trim()) return
    await supabase.from('flashcards').insert({ subject_id: subjectId, front: fcFront.trim(), back: fcBack.trim() })
    setFcFront(''); setFcBack(''); refresh()
  }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    await supabase.from('tasks').insert({
      subject_id: subjectId, title: taskTitle.trim(),
      due_date: taskDue || null, priority: taskPriority,
    })
    setTaskTitle(''); setTaskDue(''); setTaskPriority('medium'); refresh()
  }

  const toggleTask = async (t) => {
    await supabase.from('tasks').update({ completed: !t.completed }).eq('id', t.id)
    if (!t.completed) await addXp(DIFFICULTY_CONFIG[t.difficulty]?.xp || 20)
    refresh()
  }

  const deleteTask = async (id) => {
    await supabase.from('tasks').delete().eq('id', id); refresh()
  }

  const addExam = async () => {
    if (!examTitle.trim() || !examDate) return
    await supabase.from('exams').insert({ subject_id: subjectId, title: examTitle.trim(), exam_date: examDate })
    setExamTitle(''); setExamDate(''); refresh()
  }

  const deleteExam = async (id) => {
    await supabase.from('exams').delete().eq('id', id); refresh()
  }

  const addResource = () => {
    if (!resourceUrl.trim()) return
    setResources([...resources, { id: Date.now(), name: resourceName.trim() || resourceUrl.trim(), url: resourceUrl.trim() }])
    setResourceUrl(''); setResourceName('')
  }

  const addChapter = () => {
    if (!chapterName.trim()) return
    setChapters([...chapters, { id: Date.now(), name: chapterName.trim(), done: false }])
    setChapterName('')
  }

  const toggleChapter = (id) => {
    setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  }

  const deleteFlashcard = async (id) => {
    await supabase.from('flashcards').delete().eq('id', id); refresh()
  }

  const deleteNote = async (id) => {
    await supabase.from('notes').delete().eq('id', id); refresh()
  }

  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="sd-back" onClick={() => onNavigate('subjects')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <div className="sd-title-row">
          <span className="sd-icon">{subject.icon}</span>
          <div>
            <h2>{subject.name}</h2>
            {subject.target_grade && <span className="sd-grade">Target: {subject.target_grade}</span>}
          </div>
        </div>
        <div className="sd-quick-stats">
          <div><strong>{Math.floor(totalMin / 60)}h {totalMin % 60}m</strong> studied</div>
          <div><strong>{completedTasks}/{subTasks.length}</strong> tasks</div>
          <div><strong>{subFlashcards.length}</strong> cards</div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={tab === t ? { borderBottomColor: subject.color, color: subject.color } : {}}>{t}</button>
        ))}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="sd-overview">
            <div className="grid-3">
              <div className="card">
                <h4>Task Progress</h4>
                <div className="sd-prog-ring">
                  <svg viewBox="0 0 100 100" className="sd-ring">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="var(--surface-2)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="42" fill="none" stroke={subject.color} strokeWidth="8" strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 42} strokeDashoffset={2 * Math.PI * 42 * (1 - taskPct / 100)}
                      transform="rotate(-90 50 50)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                  </svg>
                  <span className="sd-prog-pct">{taskPct}%</span>
                </div>
              </div>
              <div className="card">
                <h4>Time Spent</h4>
                <p className="sd-big-num">{Math.floor(totalMin / 60)}h {totalMin % 60}m</p>
                <p className="sd-sub-text">across {subSessions.length} sessions</p>
              </div>
              <div className="card">
                <h4>Flashcards</h4>
                <p className="sd-big-num">{subFlashcards.length}</p>
                <p className="sd-sub-text">{subFlashcards.filter(f => f.starred).length} starred</p>
              </div>
            </div>
            {subject.notes && <div className="card"><h4>Subject Notes</h4><p className="sd-note-text">{subject.notes}</p></div>}
          </div>
        )}

        {tab === 'Notes' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Note title" value={noteTitle} onChange={e => setNoteTitle(e.target.value)} className="sd-input" />
              <input type="text" placeholder="Content (markdown supported)" value={noteContent} onChange={e => setNoteContent(e.target.value)} className="sd-input" />
              <button className="btn btn-primary btn-sm" onClick={addNote}>Add note</button>
            </div>
            <div className="sd-list">
              {subNotes.length === 0 ? <p className="dash-empty">No notes yet for this subject.</p> :
                subNotes.map(n => (
                  <div key={n.id} className="sd-note-item">
                    <div className="sd-note-info">
                      <span className="sd-note-title">{n.title}</span>
                      <span className="sd-note-content">{n.content}</span>
                    </div>
                    <button className="close-btn" onClick={() => deleteNote(n.id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'Flashcards' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Front (question)" value={fcFront} onChange={e => setFcFront(e.target.value)} className="sd-input" />
              <input type="text" placeholder="Back (answer)" value={fcBack} onChange={e => setFcBack(e.target.value)} className="sd-input" />
              <button className="btn btn-primary btn-sm" onClick={addFlashcard}>Add card</button>
            </div>
            <div className="fc-grid">
              {subFlashcards.length === 0 ? <p className="dash-empty">No flashcards yet.</p> :
                subFlashcards.map(f => (
                  <div key={f.id} className="fc-card">
                    <div className="fc-front">{f.front}</div>
                    <div className="fc-back">{f.back}</div>
                    <button className="close-btn fc-del" onClick={() => deleteFlashcard(f.id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'Assignments' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Assignment title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="sd-input" />
              <input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="sd-input" style={{ maxWidth: 160 }} />
              <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} className="sd-input" style={{ maxWidth: 130 }}>
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={addTask}>Add</button>
            </div>
            <div className="sd-list">
              {subTasks.length === 0 ? <p className="dash-empty">No assignments yet.</p> :
                subTasks.map(t => {
                  const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
                  return (
                    <div key={t.id} className="sd-task-item">
                      <button className="task-check" onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                      <div className="sd-task-info">
                        <span className="sd-task-title" style={t.completed ? { textDecoration: 'line-through', color: 'var(--text-3)' } : {}}>{t.title}</span>
                        {t.due_date && <span className="sd-task-due">{formatDate(t.due_date)}</span>}
                      </div>
                      <span className="dash-task-pri" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                      <button className="close-btn" onClick={() => deleteTask(t.id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {tab === 'Exams' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Exam title" value={examTitle} onChange={e => setExamTitle(e.target.value)} className="sd-input" />
              <input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} className="sd-input" style={{ maxWidth: 160 }} />
              <button className="btn btn-primary btn-sm" onClick={addExam}>Add exam</button>
            </div>
            <div className="sd-list">
              {subExams.length === 0 ? <p className="dash-empty">No exams scheduled.</p> :
                subExams.map(e => (
                  <div key={e.id} className="sd-task-item">
                    <span className="exam-dot" style={{ background: subject.color }} />
                    <div className="sd-task-info">
                      <span className="sd-task-title">{e.title}</span>
                      <span className="sd-task-due">{formatDate(e.exam_date)}</span>
                    </div>
                    <button className="close-btn" onClick={() => deleteExam(e.id)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'Resources' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Resource name" value={resourceName} onChange={e => setResourceName(e.target.value)} className="sd-input" />
              <input type="text" placeholder="URL" value={resourceUrl} onChange={e => setResourceUrl(e.target.value)} className="sd-input" />
              <button className="btn btn-primary btn-sm" onClick={addResource}>Add resource</button>
            </div>
            <div className="sd-list">
              {resources.length === 0 ? <p className="dash-empty">No resources added yet.</p> :
                resources.map(r => (
                  <a key={r.id} href={r.url} target="_blank" rel="noreferrer" className="sd-resource-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    {r.name}
                  </a>
                ))}
            </div>
          </div>
        )}

        {tab === 'Chapters' && (
          <div className="sd-tab-content">
            <div className="sd-add-row">
              <input type="text" placeholder="Chapter name" value={chapterName} onChange={e => setChapterName(e.target.value)} className="sd-input" onKeyDown={e => e.key === 'Enter' && addChapter()} />
              <button className="btn btn-primary btn-sm" onClick={addChapter}>Add chapter</button>
            </div>
            <div className="sd-list">
              {chapters.length === 0 ? <p className="dash-empty">No chapters added yet.</p> :
                chapters.map(c => (
                  <div key={c.id} className="sd-task-item">
                    <button className="task-check" onClick={() => toggleChapter(c.id)} style={c.done ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}} />
                    <span className="sd-task-title" style={c.done ? { textDecoration: 'line-through', color: 'var(--text-3)' } : {}}>{c.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {tab === 'Time Spent' && (
          <div className="sd-tab-content">
            <div className="card">
              <h4>Total Study Time</h4>
              <p className="sd-big-num">{Math.floor(totalMin / 60)}h {totalMin % 60}m</p>
              <p className="sd-sub-text">across {subSessions.length} sessions</p>
            </div>
            <div className="sd-list">
              {subSessions.length === 0 ? <p className="dash-empty">No study sessions logged yet. Start a focus session!</p> :
                subSessions.slice(0, 20).map(s => (
                  <div key={s.id} className="sd-task-item">
                    <span className="exam-dot" style={{ background: subject.color }} />
                    <div className="sd-task-info">
                      <span className="sd-task-title">{s.duration_minutes} minutes</span>
                      <span className="sd-task-due">{formatDate(s.session_date)}</span>
                    </div>
                    {s.notes && <span className="sd-session-note">{s.notes}</span>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
