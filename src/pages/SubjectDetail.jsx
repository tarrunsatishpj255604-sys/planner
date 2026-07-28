import { useState, useMemo, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, todayStr, XP_REWARDS, DIFFICULTY_CONFIG } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, refresh, addXp, unlockAchievement } = useApp()
  const [tab, setTab] = useState('Overview')
  const subject = (subjects || []).find(s => s.id === subjectId)

  const subTasks = useMemo(() => (tasks || []).filter(t => t.subject_id === subjectId), [tasks, subjectId])
  const subNotes = useMemo(() => (notes || []).filter(n => n.subject_id === subjectId), [notes, subjectId])
  const subFlashcards = useMemo(() => (flashcards || []).filter(f => f.subject_id === subjectId), [flashcards, subjectId])
  const subExams = useMemo(() => (exams || []).filter(e => e.subject_id === subjectId), [exams, subjectId])
  const subSessions = useMemo(() => (sessions || []).filter(s => s.subject_id === subjectId), [sessions, subjectId])

  const totalMins = subSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const doneTasks = subTasks.filter(t => t.completed).length
  const taskProgress = subTasks.length > 0 ? doneTasks / subTasks.length : 0

  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])
  const [newResource, setNewResource] = useState('')
  const [newChapter, setNewChapter] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newFcFront, setNewFcFront] = useState('')
  const [newFcBack, setNewFcBack] = useState('')
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
  const [newExamTitle, setNewExamTitle] = useState('')
  const [newExamDate, setNewExamDate] = useState('')

  const ringR = 52, ringC = 2 * Math.PI * ringR

  const toggleTask = useCallback(async (task) => {
    const newCompleted = !task.completed
    await supabase.from('tasks').update({ completed: newCompleted }).eq('id', task.id)
    if (newCompleted) {
      const diff = task.difficulty || 'medium'
      const xp = XP_REWARDS.task_complete + (diff === 'hard' ? XP_REWARDS.task_hard : 0)
      await addXp(xp)
    }
    refresh()
  }, [addXp, refresh])

  const addNote = async () => { if (!newNote.trim()) return; await supabase.from('notes').insert({ subject_id: subjectId, title: newNote.trim().slice(0, 50), content: newNote }); setNewNote(''); refresh() }
  const deleteNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }
  const addFlashcard = async () => { if (!newFcFront.trim() || !newFcBack.trim()) return; await supabase.from('flashcards').insert({ subject_id: subjectId, front: newFcFront.trim(), back: newFcBack.trim() }); setNewFcFront(''); setNewFcBack(''); refresh() }
  const deleteFlashcard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }
  const addTask = async () => { if (!newTaskTitle.trim()) return; await supabase.from('tasks').insert({ subject_id: subjectId, title: newTaskTitle.trim(), due_date: newTaskDue || null, priority: 'medium', difficulty: 'medium' }); setNewTaskTitle(''); setNewTaskDue(''); refresh() }
  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }
  const addExam = async () => { if (!newExamTitle.trim() || !newExamDate) return; await supabase.from('exams').insert({ subject_id: subjectId, title: newExamTitle.trim(), exam_date: newExamDate }); setNewExamTitle(''); setNewExamDate(''); refresh() }
  const deleteExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }

  const addResource = () => { if (!newResource.trim()) return; setResources(prev => [...prev, { id: Date.now(), name: newResource.trim() }]); setNewResource('') }
  const deleteResource = (id) => setResources(prev => prev.filter(r => r.id !== id))
  const addChapter = () => { if (!newChapter.trim()) return; setChapters(prev => [...prev, { id: Date.now(), name: newChapter.trim(), done: false }]); setNewChapter('') }
  const toggleChapter = (id) => setChapters(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const deleteChapter = (id) => setChapters(prev => prev.filter(c => c.id !== id))

  if (!subject) return <div className="empty-state"><div className="empty-icon">🔍</div><h3>Subject not found</h3><button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to Subjects</button></div>

  return (
    <div className="subject-detail-page">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="btn btn-ghost btn-sm sd-back" onClick={() => onNavigate('subjects')} style={{ color: '#fff' }}>← Back</button>
        <div className="sd-header-info">
          <span className="sd-icon">{subject.icon}</span>
          <div><h1 style={{ color: '#fff' }}>{subject.name}</h1>{subject.target_grade && <span className="sd-grade" style={{ color: '#fff' }}>Target: {subject.target_grade}</span>}</div>
        </div>
        <div className="sd-quick-stats">
          <div className="sd-qs"><span className="sd-qs-num">{Math.floor(totalMins / 60)}h {totalMins % 60}m</span><span className="sd-qs-label">Studied</span></div>
          <div className="sd-qs"><span className="sd-qs-num">{doneTasks}/{subTasks.length}</span><span className="sd-qs-label">Tasks</span></div>
          <div className="sd-qs"><span className="sd-qs-num">{subFlashcards.length}</span><span className="sd-qs-label">Cards</span></div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="grid-2">
            <div className="card sd-overview-ring">
              <h3>Task Progress</h3>
              <div className="sd-ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - taskProgress)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
                  <text x="70" y="75" textAnchor="middle" className="sd-ring-num">{Math.round(taskProgress * 100)}%</text>
                </svg>
              </div>
            </div>
            <div className="card">
              <h3>Quick Stats</h3>
              <div className="sd-stat-row"><span>⏱️ Total study time</span><strong>{Math.floor(totalMins / 60)}h {totalMins % 60}m</strong></div>
              <div className="sd-stat-row"><span>📝 Notes</span><strong>{subNotes.length}</strong></div>
              <div className="sd-stat-row"><span>🎴 Flashcards</span><strong>{subFlashcards.length}</strong></div>
              <div className="sd-stat-row"><span>✅ Tasks completed</span><strong>{doneTasks}/{subTasks.length}</strong></div>
              <div className="sd-stat-row"><span>📅 Exams</span><strong>{subExams.length}</strong></div>
            </div>
          </div>
        )}

        {tab === 'Notes' && (
          <div className="card">
            <h3>Notes</h3>
            <div className="sd-add-row">
              <input type="text" placeholder="New note..." value={newNote} onChange={e => setNewNote(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addNote}>Add</button>
            </div>
            <div className="sd-list">
              {subNotes.length === 0 ? <div className="dash-empty">No notes yet.</div> : subNotes.map(n => (
                <div key={n.id} className="sd-list-item"><span className="sd-list-title">{n.title}</span><button className="btn btn-ghost btn-sm" onClick={() => deleteNote(n.id)}>✕</button></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Flashcards' && (
          <div className="card">
            <h3>Flashcards</h3>
            <div className="sd-add-row sd-add-row-multi">
              <input type="text" placeholder="Front" value={newFcFront} onChange={e => setNewFcFront(e.target.value)} />
              <input type="text" placeholder="Back" value={newFcBack} onChange={e => setNewFcBack(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addFlashcard}>Add</button>
            </div>
            <div className="sd-fc-grid">
              {subFlashcards.length === 0 ? <div className="dash-empty">No flashcards yet.</div> : subFlashcards.map(f => (
                <div key={f.id} className="sd-fc-card"><div><span className="sd-fc-front">{f.front}</span><span className="sd-fc-back">{f.back}</span></div><button className="btn btn-ghost btn-sm" onClick={() => deleteFlashcard(f.id)}>✕</button></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Assignments' && (
          <div className="card">
            <h3>Assignments</h3>
            <div className="sd-add-row sd-add-row-multi">
              <input type="text" placeholder="Task title" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} />
              <input type="date" value={newTaskDue} onChange={e => setNewTaskDue(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addTask}>Add</button>
            </div>
            <div className="sd-list">
              {subTasks.length === 0 ? <div className="dash-empty">No assignments yet.</div> : subTasks.map(t => (
                <div key={t.id} className="sd-list-item sd-task-item">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>{t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}</button>
                  <span className={`sd-task-title ${t.completed ? 'done' : ''}`}>{t.title}</span>
                  {t.due_date && <span className="sd-task-due">{formatDate(t.due_date)}</span>}
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteTask(t.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Exams' && (
          <div className="card">
            <h3>Exams</h3>
            <div className="sd-add-row sd-add-row-multi">
              <input type="text" placeholder="Exam title" value={newExamTitle} onChange={e => setNewExamTitle(e.target.value)} />
              <input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={addExam}>Add</button>
            </div>
            <div className="sd-list">
              {subExams.length === 0 ? <div className="dash-empty">No exams scheduled.</div> : subExams.map(e => (
                <div key={e.id} className="sd-list-item"><span className="sd-list-title">{e.title}</span><span className="sd-exam-date">{formatDate(e.exam_date)}</span><button className="btn btn-ghost btn-sm" onClick={() => deleteExam(e.id)}>✕</button></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Resources' && (
          <div className="card">
            <h3>Resources</h3>
            <div className="sd-add-row">
              <input type="text" placeholder="Resource name or URL" value={newResource} onChange={e => setNewResource(e.target.value)} onKeyDown={e => e.key === 'Enter' && addResource()} />
              <button className="btn btn-primary btn-sm" onClick={addResource}>Add</button>
            </div>
            <div className="sd-list">
              {resources.length === 0 ? <div className="dash-empty">No resources added.</div> : resources.map(r => (
                <div key={r.id} className="sd-list-item"><span className="sd-list-title">🔗 {r.name}</span><button className="btn btn-ghost btn-sm" onClick={() => deleteResource(r.id)}>✕</button></div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Chapters' && (
          <div className="card">
            <h3>Chapters</h3>
            <div className="sd-add-row">
              <input type="text" placeholder="Chapter name" value={newChapter} onChange={e => setNewChapter(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChapter()} />
              <button className="btn btn-primary btn-sm" onClick={addChapter}>Add</button>
            </div>
            <div className="sd-list">
              {chapters.length === 0 ? <div className="dash-empty">No chapters yet.</div> : chapters.map(c => (
                <div key={c.id} className="sd-list-item sd-task-item">
                  <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggleChapter(c.id)} style={c.done ? { background: 'var(--success)', borderColor: 'var(--success)' } : {}}>{c.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>}</button>
                  <span className={`sd-task-title ${c.done ? 'done' : ''}`}>{c.name}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => deleteChapter(c.id)}>✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'Time Spent' && (
          <div className="card">
            <h3>Time Spent</h3>
            <div className="sd-total-time">{Math.floor(totalMins / 60)}h {totalMins % 60}m total</div>
            <div className="sd-list">
              {subSessions.length === 0 ? <div className="dash-empty">No study sessions logged.</div> : subSessions.map(s => (
                <div key={s.id} className="sd-list-item"><span className="sd-list-title">📚 {s.duration_minutes}m session</span><span className="sd-exam-date">{formatDate(s.session_date)}</span></div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
