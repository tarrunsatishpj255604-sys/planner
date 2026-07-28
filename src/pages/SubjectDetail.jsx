import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, todayStr, PRIORITY_CONFIG, XP_REWARDS } from '../lib/helpers.js'
import './SubjectDetail.css'

const TABS = ['Overview', 'Notes', 'Flashcards', 'Assignments', 'Exams', 'Resources', 'Chapters', 'Time Spent']

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { user, subjects, tasks, notes, flashcards, sessions, exams, refresh, addXp } = useApp()
  const subject = subjects.find(s => s.id === subjectId)
  const [tab, setTab] = useState('Overview')
  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])

  const subTasks = useMemo(() => tasks.filter(t => t.subject_id === subjectId && !t.archived), [tasks, subjectId])
  const subNotes = useMemo(() => notes.filter(n => n.subject_id === subjectId), [notes, subjectId])
  const subCards = useMemo(() => flashcards.filter(f => f.subject_id === subjectId), [flashcards, subjectId])
  const subExams = useMemo(() => exams.filter(e => e.subject_id === subjectId), [exams, subjectId])
  const subSessions = useMemo(() => sessions.filter(s => s.subject_id === subjectId), [sessions, subjectId])

  const totalMins = subSessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const doneTasks = subTasks.filter(t => t.completed).length
  const taskPct = subTasks.length ? Math.round((doneTasks / subTasks.length) * 100) : 0

  if (!subject) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔍</div>
        <h3>Subject not found</h3>
        <button className="btn btn-primary" onClick={() => onNavigate('subjects')}>Back to Subjects</button>
      </div>
    )
  }

  const toggleTask = async (task) => {
    const completed = !task.completed
    await supabase.from('tasks').update({ completed }).eq('id', task.id)
    if (completed) await addXp(XP_REWARDS.task_complete)
    refresh()
  }
  const deleteTask = async (id) => { await supabase.from('tasks').delete().eq('id', id); refresh() }
  const deleteNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }
  const deleteCard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }
  const deleteExam = async (id) => { await supabase.from('exams').delete().eq('id', id); refresh() }

  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}aa)` }}>
        <button className="btn btn-ghost sd-back" onClick={() => onNavigate('subjects')} style={{ color: '#fff' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          Back
        </button>
        <span className="sd-icon">{subject.icon}</span>
        <h1>{subject.name}</h1>
        <div className="sd-quick-stats">
          <span>⏱️ {Math.floor(totalMins / 60)}h {totalMins % 60}m</span>
          <span>📝 {subNotes.length} notes</span>
          <span>🎴 {subCards.length} cards</span>
          <span>✅ {doneTasks}/{subTasks.length} tasks</span>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => (
          <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      <div className="sd-content">
        {tab === 'Overview' && (
          <div className="grid-3 sd-overview">
            <div className="card">
              <div className="card-head"><h3>Task Progress</h3></div>
              <div className="sd-ring-wrap">
                <svg className="sd-ring" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="52" fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52} strokeDashoffset={2 * Math.PI * 52 * (1 - taskPct / 100)}
                    transform="rotate(-90 60 60)" />
                </svg>
                <div className="sd-ring-text"><span className="sd-pct">{taskPct}%</span></div>
              </div>
              <p className="sd-center-text">{doneTasks} of {subTasks.length} tasks complete</p>
            </div>
            <div className="card">
              <div className="card-head"><h3>Time Spent</h3></div>
              <p className="sd-big-stat">{Math.floor(totalMins / 60)}h {totalMins % 60}m</p>
              <p className="sd-sub-stat">across {subSessions.length} sessions</p>
            </div>
            <div className="card">
              <div className="card-head"><h3>Flashcards</h3></div>
              <p className="sd-big-stat">{subCards.length}</p>
              <p className="sd-sub-stat">cards in this subject</p>
            </div>
          </div>
        )}

        {tab === 'Notes' && (
          <NotesTab subjectId={subjectId} user={user} notes={subNotes} onDelete={deleteNote} onRefresh={refresh} />
        )}

        {tab === 'Flashcards' && (
          <FlashcardsTab subjectId={subjectId} user={user} cards={subCards} onDelete={deleteCard} onRefresh={refresh} addXp={addXp} />
        )}

        {tab === 'Assignments' && (
          <AssignmentsTab subjectId={subjectId} user={user} tasks={subTasks} onToggle={toggleTask} onDelete={deleteTask} onRefresh={refresh} />
        )}

        {tab === 'Exams' && (
          <ExamsTab subjectId={subjectId} user={user} exams={subExams} onDelete={deleteExam} onRefresh={refresh} />
        )}

        {tab === 'Resources' && (
          <ResourcesTab resources={resources} setResources={setResources} />
        )}

        {tab === 'Chapters' && (
          <ChaptersTab chapters={chapters} setChapters={setChapters} />
        )}

        {tab === 'Time Spent' && (
          <div className="card">
            <div className="card-head"><h3>Study Sessions</h3></div>
            <p className="sd-big-stat">{Math.floor(totalMins / 60)}h {totalMins % 60}m total</p>
            {subSessions.length === 0 ? (
              <p className="dash-empty">No sessions logged yet.</p>
            ) : (
              <ul className="sd-session-list">
                {subSessions.map(s => (
                  <li key={s.id} className="sd-session-item">
                    <span className="sd-session-date">{s.session_date}</span>
                    <span className="sd-session-dur">{Math.floor((s.duration || 0) / 60)}h {(s.duration || 0) % 60}m</span>
                    {s.notes && <span className="sd-session-notes">{s.notes}</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function NotesTab({ subjectId, user, notes, onDelete, onRefresh }) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!title.trim() || busy) return
    setBusy(true)
    await supabase.from('notes').insert({ user_id: user.id, subject_id: subjectId, title: title.trim(), content })
    setTitle(''); setContent(''); setBusy(false); onRefresh()
  }

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Note</h3></div>
        <div className="form-field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Note title" /></div>
        <div className="form-field"><label>Content</label><textarea rows="4" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your note..." /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add} disabled={busy}>Add Note</button></div>
      </div>
      <div className="sd-list">
        {notes.length === 0 && <p className="dash-empty">No notes yet.</p>}
        {notes.map(n => (
          <div key={n.id} className="sd-list-item">
            <div className="sd-list-main">
              <h4>{n.title}</h4>
              <p className="sd-list-preview">{n.content}</p>
            </div>
            <button className="sd-list-delete" onClick={() => onDelete(n.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function FlashcardsTab({ subjectId, user, cards, onDelete, onRefresh, addXp }) {
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!front.trim() || !back.trim() || busy) return
    setBusy(true)
    await supabase.from('flashcards').insert({ user_id: user.id, subject_id: subjectId, front: front.trim(), back: back.trim() })
    setFront(''); setBack(''); setBusy(false); onRefresh()
  }

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Flashcard</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Front</label><input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question" /></div>
          <div className="form-field"><label>Back</label><input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Answer" /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add} disabled={busy}>Add Card</button></div>
      </div>
      <div className="sd-fc-grid">
        {cards.length === 0 && <p className="dash-empty">No flashcards yet.</p>}
        {cards.map(c => (
          <div key={c.id} className="sd-fc-card">
            <div className="sd-fc-front">{c.front}</div>
            <div className="sd-fc-back">{c.back}</div>
            <button className="sd-list-delete" onClick={() => onDelete(c.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AssignmentsTab({ subjectId, user, tasks, onToggle, onDelete, onRefresh }) {
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('medium')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!title.trim() || busy) return
    setBusy(true)
    await supabase.from('tasks').insert({
      user_id: user.id, subject_id: subjectId, title: title.trim(),
      due_date: dueDate || null, priority, completed: false, archived: false,
    })
    setTitle(''); setDueDate(''); setPriority('medium'); setBusy(false); onRefresh()
  }

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Assignment</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Assignment title" /></div>
          <div className="form-field"><label>Due date</label><input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
        </div>
        <div className="form-field">
          <label>Priority</label>
          <div className="seg-pick">
            {Object.entries(PRIORITY_CONFIG).map(([k, v]) => (
              <button key={k} className={`seg-btn ${priority === k ? 'active' : ''}`} style={priority === k ? { background: v.color, color: '#fff' } : {}} onClick={() => setPriority(k)}>{v.label}</button>
            ))}
          </div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add} disabled={busy}>Add Task</button></div>
      </div>
      <div className="sd-list">
        {tasks.length === 0 && <p className="dash-empty">No assignments yet.</p>}
        {tasks.map(t => {
          const pc = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium
          return (
            <div key={t.id} className="sd-list-item">
              <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => onToggle(t)}>
                {t.completed && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
              </button>
              <div className="sd-list-main">
                <h4 className={t.completed ? 'done' : ''}>{t.title}</h4>
                <div className="sd-task-meta">
                  <span className="meta-chip" style={{ background: pc.bg, color: pc.color }}>{pc.label}</span>
                  {t.due_date && <span className="meta-chip">{formatDate(t.due_date)}</span>}
                </div>
              </div>
              <button className="sd-list-delete" onClick={() => onDelete(t.id)}>×</button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ExamsTab({ subjectId, user, exams, onDelete, onRefresh }) {
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')
  const [busy, setBusy] = useState(false)

  const add = async () => {
    if (!title.trim() || !date || busy) return
    setBusy(true)
    await supabase.from('exams').insert({ user_id: user.id, subject_id: subjectId, title: title.trim(), exam_date: date })
    setTitle(''); setDate(''); setBusy(false); onRefresh()
  }

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Exam</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Title</label><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Exam title" /></div>
          <div className="form-field"><label>Date</label><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add} disabled={busy}>Add Exam</button></div>
      </div>
      <div className="sd-list">
        {exams.length === 0 && <p className="dash-empty">No exams scheduled.</p>}
        {exams.map(e => (
          <div key={e.id} className="sd-list-item">
            <div className="sd-list-main"><h4>{e.title}</h4><span className="sd-exam-date">{formatDate(e.exam_date)}</span></div>
            <button className="sd-list-delete" onClick={() => onDelete(e.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ResourcesTab({ resources, setResources }) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')

  const add = () => {
    if (!name.trim()) return
    setResources([...resources, { id: Date.now(), name: name.trim(), url: url.trim() }])
    setName(''); setUrl('')
  }
  const remove = (id) => setResources(resources.filter(r => r.id !== id))

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Resource</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Resource name" /></div>
          <div className="form-field"><label>URL</label><input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></div>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Resource</button></div>
      </div>
      <div className="sd-list">
        {resources.length === 0 && <p className="dash-empty">No resources saved.</p>}
        {resources.map(r => (
          <div key={r.id} className="sd-list-item">
            <div className="sd-list-main">
              <h4>{r.name}</h4>
              {r.url && <a href={r.url} target="_blank" rel="noreferrer" className="sd-resource-link">{r.url}</a>}
            </div>
            <button className="sd-list-delete" onClick={() => remove(r.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function ChaptersTab({ chapters, setChapters }) {
  const [name, setName] = useState('')

  const add = () => {
    if (!name.trim()) return
    setChapters([...chapters, { id: Date.now(), name: name.trim(), done: false }])
    setName('')
  }
  const toggle = (id) => setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const remove = (id) => setChapters(chapters.filter(c => c.id !== id))

  return (
    <div className="sd-tab-content">
      <div className="form-card">
        <div className="form-head"><h3>Add Chapter</h3></div>
        <div className="form-field"><label>Chapter name</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chapter 1: Introduction" onKeyDown={(e) => e.key === 'Enter' && add()} /></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Chapter</button></div>
      </div>
      <div className="sd-list">
        {chapters.length === 0 && <p className="dash-empty">No chapters yet.</p>}
        {chapters.map(c => (
          <div key={c.id} className="sd-list-item">
            <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggle(c.id)}>
              {c.done && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </button>
            <div className="sd-list-main"><h4 className={c.done ? 'done' : ''}>{c.name}</h4></div>
            <button className="sd-list-delete" onClick={() => remove(c.id)}>×</button>
          </div>
        ))}
      </div>
    </div>
  )
}
