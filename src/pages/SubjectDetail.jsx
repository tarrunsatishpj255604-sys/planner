import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, formatDate } from '../lib/helpers.js'
import './SubjectDetail.css'

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, addXp, unlockAchievement, refresh } = useApp()
  const [tab, setTab] = useState('overview')
  const [newNote, setNewNote] = useState('')
  const [newFcFront, setNewFcFront] = useState('')
  const [newFcBack, setNewFcBack] = useState('')
  const [newTask, setNewTask] = useState('')
  const [newExam, setNewExam] = useState('')
  const [newExamDate, setNewExamDate] = useState('')
  const [resources, setResources] = useState([])
  const [newResource, setNewResource] = useState('')
  const [chapters, setChapters] = useState([])
  const [newChapter, setNewChapter] = useState('')

  const subject = subjects.find(s => s.id === subjectId)
  if (!subject) return <div className="empty-state"><h3>Subject not found</h3><button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back</button></div>

  const subTasks = tasks.filter(t => t.subject_id === subjectId)
  const subNotes = notes.filter(n => n.subject_id === subjectId)
  const subFlashcards = flashcards.filter(f => f.subject_id === subjectId)
  const subSessions = sessions.filter(s => s.subject_id === subjectId)
  const subExams = exams.filter(e => e.subject_id === subjectId)
  const totalTime = subSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const taskPct = subTasks.length > 0 ? Math.round((subTasks.filter(t => t.completed).length / subTasks.length) * 100) : 0

  const addNote = async () => { if (!newNote.trim()) return; await supabase.from('notes').insert({ title: newNote.trim().slice(0, 40), content: newNote.trim(), subject_id: subjectId, folder: 'General' }).select().single(); setNewNote(''); refresh() }
  const deleteNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }
  const addFlashcard = async () => { if (!newFcFront.trim() || !newFcBack.trim()) return; await supabase.from('flashcards').insert({ front: newFcFront.trim(), back: newFcBack.trim(), subject_id: subjectId, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false }).select().single(); setNewFcFront(''); setNewFcBack(''); refresh() }
  const deleteFlashcard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }
  const addTask = async () => { if (!newTask.trim()) return; await supabase.from('tasks').insert({ title: newTask.trim(), subject_id: subjectId, priority: 'medium', completed: false }).select().single(); setNewTask(''); refresh() }
  const toggleTask = async (task) => { await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id); if (!task.completed) { addXp(20); unlockAchievement('first_task') } refresh() }
  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }
  const addExam = async () => { if (!newExam.trim() || !newExamDate) return; await supabase.from('exams').insert({ title: newExam.trim(), exam_date: newExamDate, subject_id: subjectId }).select().single(); setNewExam(''); setNewExamDate(''); refresh() }
  const deleteExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }
  const addResource = () => { if (!newResource.trim()) return; setResources([...resources, { id: Date.now(), name: newResource.trim() }]); setNewResource('') }
  const addChapter = () => { if (!newChapter.trim()) return; setChapters([...chapters, { id: Date.now(), name: newChapter.trim(), done: false }]); setNewChapter('') }

  const TABS = ['overview', 'notes', 'flashcards', 'assignments', 'exams', 'resources', 'chapters', 'time']

  return (
    <div className="sd-page">
      <button className="btn btn-ghost btn-sm back-btn" onClick={() => onNavigate('subjects')}>← Back to Subjects</button>
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}dd)` }}>
        <span className="sd-icon">📘</span>
        <div className="sd-header-info"><h2>{subject.name}</h2>{subject.target_grade && <span>Target: {subject.target_grade}</span>}</div>
        <div className="sd-quick-stats"><span>⏱️ {Math.floor(totalTime / 60)}h {totalTime % 60}m</span><span>📝 {subTasks.length} tasks</span><span>🃏 {subFlashcards.length} cards</span></div>
      </div>

      <div className="sd-tabs">{TABS.map(t => <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)} style={tab === t ? { background: subject.color, color: '#fff' } : {}}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}</div>

      {tab === 'overview' && (
        <div className="grid-3">
          <div className="card"><h3>Task Progress</h3><div className="sd-ring-wrap"><svg width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="6" /><circle cx="50" cy="50" r="42" fill="none" stroke={subject.color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 42 * taskPct / 100} ${2 * Math.PI * 42}`} transform="rotate(-90 50 50)" /></svg><span className="sd-ring-pct">{taskPct}%</span></div></div>
          <div className="card"><h3>Study Time</h3><div className="sd-big-stat">{Math.floor(totalTime / 60)}h {totalTime % 60}m</div><p className="dash-empty">Across {subSessions.length} sessions</p></div>
          <div className="card"><h3>Flashcards</h3><div className="sd-big-stat">{subFlashcards.length}</div><p className="dash-empty">{subFlashcards.filter(f => f.starred).length} starred</p></div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="card">
          <h3>Notes</h3>
          <div className="sd-add-row"><input value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Write a note..." onKeyDown={e => e.key === 'Enter' && addNote()} /><button className="btn btn-primary btn-sm" onClick={addNote}>Add</button></div>
          {subNotes.length === 0 ? <div className="dash-empty">No notes yet.</div> : subNotes.map(n => <div key={n.id} className="sd-item"><div><strong>{n.title}</strong><p className="sd-preview">{n.content}</p></div><button className="sd-del" onClick={() => deleteNote(n.id)}>×</button></div>)}
        </div>
      )}

      {tab === 'flashcards' && (
        <div className="card">
          <h3>Flashcards</h3>
          <div className="sd-fc-form"><input value={newFcFront} onChange={e => setNewFcFront(e.target.value)} placeholder="Front (question)" /><input value={newFcBack} onChange={e => setNewFcBack(e.target.value)} placeholder="Back (answer)" /><button className="btn btn-primary btn-sm" onClick={addFlashcard}>Add</button></div>
          {subFlashcards.length === 0 ? <div className="dash-empty">No flashcards yet.</div> : <div className="sd-fc-grid">{subFlashcards.map(fc => <div key={fc.id} className="sd-fc-card"><div><div className="sd-fc-front">{fc.front}</div><div className="sd-fc-back">{fc.back}</div></div><button className="sd-del" onClick={() => deleteFlashcard(fc.id)}>×</button></div>)}</div>}
        </div>
      )}

      {tab === 'assignments' && (
        <div className="card">
          <h3>Assignments</h3>
          <div className="sd-add-row"><input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder="New assignment..." onKeyDown={e => e.key === 'Enter' && addTask()} /><button className="btn btn-primary btn-sm" onClick={addTask}>Add</button></div>
          {subTasks.length === 0 ? <div className="dash-empty">No assignments yet.</div> : subTasks.map(t => <div key={t.id} className="sd-item"><span className="task-check" style={t.completed ? { background: subject.color, borderColor: subject.color } : {}} onClick={() => toggleTask(t)} /><span style={{ flex: 1, textDecoration: t.completed ? 'line-through' : 'none', color: t.completed ? 'var(--text-3)' : 'var(--text)' }}>{t.title}</span><button className="sd-del" onClick={() => deleteTask(t.id)}>×</button></div>)}
        </div>
      )}

      {tab === 'exams' && (
        <div className="card">
          <h3>Exams</h3>
          <div className="sd-add-row"><input value={newExam} onChange={e => setNewExam(e.target.value)} placeholder="Exam title" /><input type="date" value={newExamDate} onChange={e => setNewExamDate(e.target.value)} /><button className="btn btn-primary btn-sm" onClick={addExam}>Add</button></div>
          {subExams.length === 0 ? <div className="dash-empty">No exams yet.</div> : subExams.map(ex => <div key={ex.id} className="sd-item"><div><strong>{ex.title}</strong><p className="dash-empty">{formatDate(ex.exam_date)}</p></div><button className="sd-del" onClick={() => deleteExam(ex.id)}>×</button></div>)}
        </div>
      )}

      {tab === 'resources' && (
        <div className="card">
          <h3>Resources</h3>
          <div className="sd-add-row"><input value={newResource} onChange={e => setNewResource(e.target.value)} placeholder="Resource name or link" onKeyDown={e => e.key === 'Enter' && addResource()} /><button className="btn btn-primary btn-sm" onClick={addResource}>Add</button></div>
          {resources.length === 0 ? <div className="dash-empty">No resources added yet.</div> : resources.map(r => <div key={r.id} className="sd-item"><span>📎 {r.name}</span><button className="sd-del" onClick={() => setResources(resources.filter(x => x.id !== r.id))}>×</button></div>)}
        </div>
      )}

      {tab === 'chapters' && (
        <div className="card">
          <h3>Chapters</h3>
          <div className="sd-add-row"><input value={newChapter} onChange={e => setNewChapter(e.target.value)} placeholder="Chapter name" onKeyDown={e => e.key === 'Enter' && addChapter()} /><button className="btn btn-primary btn-sm" onClick={addChapter}>Add</button></div>
          {chapters.length === 0 ? <div className="dash-empty">No chapters yet.</div> : chapters.map(ch => <div key={ch.id} className="sd-item"><span className="task-check" style={ch.done ? { background: subject.color, borderColor: subject.color } : {}} onClick={() => setChapters(chapters.map(x => x.id === ch.id ? { ...x, done: !x.done } : x))} /><span style={{ flex: 1, textDecoration: ch.done ? 'line-through' : 'none' }}>{ch.name}</span><button className="sd-del" onClick={() => setChapters(chapters.filter(x => x.id !== ch.id))}>×</button></div>)}
        </div>
      )}

      {tab === 'time' && (
        <div className="card">
          <h3>Time Spent</h3>
          <div className="sd-big-stat" style={{ marginBottom: 16 }}>{Math.floor(totalTime / 60)}h {totalTime % 60}m total</div>
          {subSessions.length === 0 ? <div className="dash-empty">No sessions logged yet.</div> : subSessions.map(s => <div key={s.id} className="sd-item"><div><strong>{s.duration_minutes} minutes</strong><p className="dash-empty">{formatDate(s.session_date)}</p></div>{s.notes && <span className="dash-empty">{s.notes}</span>}</div>)}
        </div>
      )}
    </div>
  )
}
