import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, formatDate } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, loading, refresh, addXp, unlockAchievement } = useApp()
  const [tab, setTab] = useState('Overview')
  const subject = subjects.find(s => s.id === subjectId)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>
  if (!subject) return (
    <div className="empty-state">
      <div className="empty-icon" style={{ background: 'var(--error-l)', color: 'var(--error)', fontSize: 28 }}>❓</div>
      <h3>Subject not found</h3>
      <button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to Subjects</button>
    </div>
  )

  const subNotes = notes.filter(n => n.subject_id === subjectId)
  const subFlashcards = flashcards.filter(f => f.subject_id === subjectId)
  const subTasks = tasks.filter(t => t.subject_id === subjectId)
  const subExams = exams.filter(e => e.subject_id === subjectId)
  const subSessions = sessions.filter(s => s.subject_id === subjectId)
  const studyMins = subSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedTasks = subTasks.filter(t => t.completed).length
  const taskPct = subTasks.length ? completedTasks / subTasks.length : 0

  return (
    <div className="subject-detail-page">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="btn btn-sm back-btn" onClick={() => onNavigate('subjects')}>← Back</button>
        <div className="sd-header-content">
          <span className="sd-icon">{subject.icon || '📘'}</span>
          <div>
            <h1 className="sd-title">{subject.name}</h1>
            <div className="sd-meta">
              <span>⏱️ {Math.floor(studyMins / 60)}h {studyMins % 60}m</span>
              <span>✅ {completedTasks}/{subTasks.length} tasks</span>
              <span>🃏 {subFlashcards.length} cards</span>
              {subject.target_grade && <span>🎯 Target: {subject.target_grade}</span>}
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
        {tab === 'Overview' && <OverviewTab subject={subject} studyMins={studyMins} taskPct={taskPct} subNotes={subNotes} subFlashcards={subFlashcards} subExams={subExams} subSessions={subSessions} />}
        {tab === 'Notes' && <NotesTab subjectId={subjectId} subNotes={subNotes} refresh={refresh} />}
        {tab === 'Flashcards' && <FlashcardsTab subjectId={subjectId} subFlashcards={subFlashcards} refresh={refresh} />}
        {tab === 'Assignments' && <AssignmentsTab subjectId={subjectId} subTasks={subTasks} refresh={refresh} addXp={addXp} unlockAchievement={unlockAchievement} />}
        {tab === 'Exams' && <ExamsTab subjectId={subjectId} subExams={subExams} refresh={refresh} />}
        {tab === 'Resources' && <ResourcesTab />}
        {tab === 'Chapters' && <ChaptersTab />}
        {tab === 'Time Spent' && <TimeSpentTab subSessions={subSessions} studyMins={studyMins} />}
      </div>
    </div>
  )
}

function OverviewTab({ subject, studyMins, taskPct, subNotes, subFlashcards, subExams, subSessions }) {
  const ringR = 52, ringC = 2 * Math.PI * ringR
  return (
    <div className="grid-2">
      <div className="card overview-ring-card">
        <div className="card-head"><h3>Task Progress</h3></div>
        <div className="overview-ring-wrap">
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
            <circle cx="70" cy="70" r={ringR} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round"
              strokeDasharray={ringC} strokeDashoffset={ringC * (1 - taskPct)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
            <text x="70" y="75" textAnchor="middle" className="ring-pct" style={{ fontSize: 24, fontWeight: 800, fill: 'var(--text)' }}>{Math.round(taskPct * 100)}%</text>
          </svg>
        </div>
        <p className="overview-ring-label">{Math.round(taskPct * 100)}% of tasks completed</p>
      </div>
      <div className="card">
        <div className="card-head"><h3>Quick Stats</h3></div>
        <div className="overview-stats">
          <div className="ov-stat"><span className="ov-num">{subNotes.length}</span><span className="ov-lbl">Notes</span></div>
          <div className="ov-stat"><span className="ov-num">{subFlashcards.length}</span><span className="ov-lbl">Flashcards</span></div>
          <div className="ov-stat"><span className="ov-num">{subExams.length}</span><span className="ov-lbl">Exams</span></div>
          <div className="ov-stat"><span className="ov-num">{subSessions.length}</span><span className="ov-lbl">Sessions</span></div>
        </div>
      </div>
    </div>
  )
}

function NotesTab({ subjectId, subNotes, refresh }) {
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const add = async () => {
    if (!content.trim()) return
    await supabase.from('notes').insert({ title: title.trim() || 'Untitled', content: content.trim(), subject_id: subjectId, folder: 'General' })
    setTitle(''); setContent(''); refresh()
  }
  const del = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Note</h3></div>
        <div className="form-field"><label>Title</label><input type="text" placeholder="Note title" value={title} onChange={e => setTitle(e.target.value)} /></div>
        <div className="form-field"><label>Content</label><textarea rows="4" placeholder="Write your note..." value={content} onChange={e => setContent(e.target.value)} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Note</button></div>
      </div>
      {subNotes.length === 0 ? <div className="dash-empty">No notes for this subject yet.</div> : (
        <div className="sd-list">
          {subNotes.map(n => (
            <div key={n.id} className="sd-list-item">
              <div className="sd-li-info"><span className="sd-li-title">{n.title}</span><span className="sd-li-preview">{n.content?.slice(0, 80) || 'No content'}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => del(n.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FlashcardsTab({ subjectId, subFlashcards, refresh }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const add = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    setFront(''); setBack(''); refresh()
  }
  const del = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Flashcard</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Front</label><input type="text" placeholder="Question" value={front} onChange={e => setFront(e.target.value)} /></div>
          <div className="form-field"><label>Back</label><input type="text" placeholder="Answer" value={back} onChange={e => setBack(e.target.value)} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Card</button></div>
      </div>
      {subFlashcards.length === 0 ? <div className="dash-empty">No flashcards for this subject yet.</div> : (
        <div className="sd-list">
          {subFlashcards.map(fc => (
            <div key={fc.id} className="sd-list-item">
              <div className="sd-li-info"><span className="sd-li-title">{fc.front}</span><span className="sd-li-preview">{fc.back}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => del(fc.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AssignmentsTab({ subjectId, subTasks, refresh, addXp, unlockAchievement }) {
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const add = async () => {
    if (!title.trim()) return
    await supabase.from('tasks').insert({ title: title.trim(), subject_id: subjectId, due_date: due || null, priority: 'medium', completed: false })
    setTitle(''); setDue(''); refresh()
  }
  const toggle = async (task) => {
    await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id)
    if (!task.completed) { await addXp(20); await unlockAchievement('first_task') }
    refresh()
  }
  const del = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Assignment</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Title</label><input type="text" placeholder="Assignment title" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="form-field"><label>Due Date</label><input type="date" value={due} onChange={e => setDue(e.target.value)} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Task</button></div>
      </div>
      {subTasks.length === 0 ? <div className="dash-empty">No assignments for this subject yet.</div> : (
        <div className="sd-list">
          {subTasks.map(t => (
            <div key={t.id} className="sd-list-item">
              <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggle(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
              </button>
              <div className="sd-li-info"><span className={`sd-li-title ${t.completed ? 'done' : ''}`}>{t.title}</span><span className="sd-li-preview">{t.due_date ? formatDate(t.due_date) : 'No due date'}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => del(t.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExamsTab({ subjectId, subExams, refresh }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const add = async () => {
    if (!title.trim() || !date) return
    await supabase.from('exams').insert({ title: title.trim(), subject_id: subjectId, exam_date: date })
    setTitle(''); setDate(''); refresh()
  }
  const del = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Exam</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Exam Title</label><input type="text" placeholder="e.g. Midterm" value={title} onChange={e => setTitle(e.target.value)} /></div>
          <div className="form-field"><label>Exam Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Exam</button></div>
      </div>
      {subExams.length === 0 ? <div className="dash-empty">No exams for this subject yet.</div> : (
        <div className="sd-list">
          {subExams.map(ex => (
            <div key={ex.id} className="sd-list-item">
              <div className="sd-li-info"><span className="sd-li-title">{ex.title}</span><span className="sd-li-preview">{formatDate(ex.exam_date)}</span></div>
              <button className="btn btn-ghost btn-sm" onClick={() => del(ex.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ResourcesTab() {
  const [resources, setResources] = useState([])
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const add = () => {
    if (!name.trim()) return
    setResources(prev => [...prev, { id: Date.now(), name: name.trim(), url: url.trim() }])
    setName(''); setUrl('')
  }
  const del = (id) => setResources(prev => prev.filter(r => r.id !== id))
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Resource</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Name</label><input type="text" placeholder="Resource name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="form-field"><label>URL (optional)</label><input type="text" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Resource</button></div>
      </div>
      {resources.length === 0 ? <div className="dash-empty">No resources added yet.</div> : (
        <div className="sd-list">
          {resources.map(r => (
            <div key={r.id} className="sd-list-item">
              <div className="sd-li-info"><span className="sd-li-title">{r.name}</span>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="sd-li-preview">{r.url}</a>}</div>
              <button className="btn btn-ghost btn-sm" onClick={() => del(r.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ChaptersTab() {
  const [chapters, setChapters] = useState([])
  const [name, setName] = useState('')
  const add = () => {
    if (!name.trim()) return
    setChapters(prev => [...prev, { id: Date.now(), name: name.trim(), done: false }])
    setName('')
  }
  const toggle = (id) => setChapters(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const del = (id) => setChapters(prev => prev.filter(c => c.id !== id))
  return (
    <div>
      <div className="form-card">
        <div className="form-head"><h3>Add Chapter</h3></div>
        <div className="form-field"><label>Chapter Name</label><input type="text" placeholder="e.g. Chapter 1: Algebra" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Chapter</button></div>
      </div>
      {chapters.length === 0 ? <div className="dash-empty">No chapters added yet.</div> : (
        <div className="sd-list">
          {chapters.map(ch => (
            <div key={ch.id} className="sd-list-item">
              <button className={`task-check ${ch.done ? 'checked' : ''}`} onClick={() => toggle(ch.id)} style={ch.done ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}}>
                {ch.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
              </button>
              <span className={`sd-li-title ${ch.done ? 'done' : ''}`} style={{ flex: 1 }}>{ch.name}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => del(ch.id)}>🗑️</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function TimeSpentTab({ subSessions, studyMins }) {
  return (
    <div className="card">
      <div className="card-head"><h3>Study Sessions</h3><span className="total-time-badge">{Math.floor(studyMins / 60)}h {studyMins % 60}m total</span></div>
      {subSessions.length === 0 ? <div className="dash-empty">No study sessions logged yet.</div> : (
        <div className="sd-list">
          {subSessions.map(s => (
            <div key={s.id} className="sd-list-item">
              <div className="sd-li-info"><span className="sd-li-title">{s.duration_minutes}m session</span><span className="sd-li-preview">{formatDate(s.session_date)}{s.notes ? ` · ${s.notes}` : ''}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
