import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './SubjectDetail.css'

export default function SubjectDetail({ subjectId, onNavigate }) {
  const { subjects, tasks, notes, flashcards, sessions, exams, loading, refresh, addXp, unlockAchievement } = useApp()
  const [tab, setTab] = useState('overview')
  const subject = subjects.find(s => s.id === subjectId)

  // form states
  const [noteText, setNoteText] = useState('')
  const [fcFront, setFcFront] = useState('')
  const [fcBack, setFcBack] = useState('')
  const [taskTitle, setTaskTitle] = useState('')
  const [examTitle, setExamTitle] = useState('')
  const [examDate, setExamDate] = useState('')
  const [resName, setResName] = useState('')
  const [resUrl, setResUrl] = useState('')
  const [chapName, setChapName] = useState('')
  const [resources, setResources] = useState([])
  const [chapters, setChapters] = useState([])

  if (loading || !subject) return <div className="sd-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const subjTasks = tasks.filter(t => t.subject_id === subjectId)
  const subjNotes = notes.filter(n => n.subject_id === subjectId)
  const subjFc = flashcards.filter(f => f.subject_id === subjectId)
  const subjExams = exams.filter(e => e.subject_id === subjectId)
  const subjSessions = sessions.filter(s => s.subject_id === subjectId)
  const totalTime = subjSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const completedTasks = subjTasks.filter(t => t.completed).length
  const taskPct = subjTasks.length ? Math.round((completedTasks / subjTasks.length) * 100) : 0

  const addNote = async () => {
    if (!noteText.trim()) return
    await supabase.from('notes').insert({ title: noteText.trim().slice(0, 40), content: noteText.trim(), subject_id: subjectId, folder: 'General' })
    setNoteText(''); refresh()
  }
  const delNote = async (id) => { await supabase.from('notes').delete().eq('id', id); refresh() }

  const addFc = async () => {
    if (!fcFront.trim() || !fcBack.trim()) return
    await supabase.from('flashcards').insert({ front: fcFront.trim(), back: fcBack.trim(), subject_id: subjectId, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    setFcFront(''); setFcBack(''); refresh()
  }
  const delFc = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const addTask = async () => {
    if (!taskTitle.trim()) return
    await supabase.from('tasks').insert({ title: taskTitle.trim(), subject_id: subjectId, priority: 'medium', due_date: todayStr() })
    setTaskTitle(''); refresh()
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

  const addRes = () => { if (!resName.trim()) return; setResources([...resources, { id: Date.now(), name: resName.trim(), url: resUrl.trim() }]); setResName(''); setResUrl('') }
  const delRes = (id) => setResources(resources.filter(r => r.id !== id))
  const addChap = () => { if (!chapName.trim()) return; setChapters([...chapters, { id: Date.now(), name: chapName.trim(), done: false }]); setChapName('') }
  const toggleChap = (id) => setChapters(chapters.map(c => c.id === id ? { ...c, done: !c.done } : c))
  const delChap = (id) => setChapters(chapters.filter(c => c.id !== id))

  const ringR = 52, ringC = 2 * Math.PI * ringR
  const TABS = ['overview', 'notes', 'flashcards', 'assignments', 'exams', 'resources', 'chapters', 'time']

  return (
    <div className="subject-detail">
      <div className="sd-header" style={{ background: `linear-gradient(135deg, ${subject.color}, ${subject.color}cc)` }}>
        <button className="btn btn-ghost btn-sm sd-back" onClick={() => onNavigate('subjects')} style={{ color: '#fff' }}>← Back</button>
        <div className="sd-head-main">
          <span className="sd-icon">{subject.icon || '📘'}</span>
          <div><h1>{subject.name}</h1>{subject.target_grade && <span className="sd-grade">Target: {subject.target_grade}</span>}</div>
        </div>
        <div className="sd-quickstats">
          <div className="sd-qs"><span className="sd-qs-val">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span><span className="sd-qs-label">Total time</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subjTasks.length}</span><span className="sd-qs-label">Tasks</span></div>
          <div className="sd-qs"><span className="sd-qs-val">{subjFc.length}</span><span className="sd-qs-label">Flashcards</span></div>
        </div>
      </div>

      <div className="sd-tabs">
        {TABS.map(t => <button key={t} className={`sd-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
      </div>

      <div className="sd-tab-content">
        {tab === 'overview' && (
          <div className="grid-2">
            <div className="card">
              <div className="card-head"><h3>Progress</h3></div>
              <div className="sd-ring-wrap">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke="var(--surface-2)" strokeWidth="10" />
                  <circle cx="70" cy="70" r={ringR} fill="none" stroke={subject.color} strokeWidth="10" strokeLinecap="round" strokeDasharray={ringC} strokeDashoffset={ringC * (1 - taskPct / 100)} transform="rotate(-90 70 70)" style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
                </svg>
                <div className="sd-ring-center"><span className="sd-ring-pct">{taskPct}%</span><span className="sd-ring-sub">tasks done</span></div>
              </div>
            </div>
            <div className="card">
              <div className="card-head"><h3>Stats</h3></div>
              <div className="sd-stat-row"><span>⏱️ Total study time</span><strong>{Math.floor(totalTime / 60)}h {totalTime % 60}m</strong></div>
              <div className="sd-stat-row"><span>🃏 Flashcards</span><strong>{subjFc.length}</strong></div>
              <div className="sd-stat-row"><span>📝 Notes</span><strong>{subjNotes.length}</strong></div>
              <div className="sd-stat-row"><span>📋 Tasks</span><strong>{completedTasks}/{subjTasks.length}</strong></div>
              <div className="sd-stat-row"><span>📅 Exams</span><strong>{subjExams.length}</strong></div>
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="card">
            <div className="sd-add-row">
              <textarea className="sd-textarea" placeholder="Write a note..." value={noteText} onChange={e => setNoteText(e.target.value)} rows={2} />
              <button className="btn btn-primary" onClick={addNote}>Add Note</button>
            </div>
            {subjNotes.length === 0 ? <div className="dash-empty">No notes yet.</div> : (
              <div className="sd-item-list">{subjNotes.map(n => (
                <div key={n.id} className="sd-item"><div className="sd-item-main"><strong>{n.title}</strong><p>{n.content}</p></div>
                  <button className="sd-del" onClick={() => delNote(n.id)}>×</button></div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'flashcards' && (
          <div className="card">
            <div className="sd-add-row sd-add-col">
              <input className="sd-input" placeholder="Front" value={fcFront} onChange={e => setFcFront(e.target.value)} />
              <input className="sd-input" placeholder="Back" value={fcBack} onChange={e => setFcBack(e.target.value)} />
              <button className="btn btn-primary" onClick={addFc}>Add Card</button>
            </div>
            {subjFc.length === 0 ? <div className="dash-empty">No flashcards yet.</div> : (
              <div className="sd-fc-grid">{subjFc.map(f => (
                <div key={f.id} className="sd-fc-card"><div className="sd-fc-front">{f.front}</div><div className="sd-fc-back">{f.back}</div>
                  <button className="sd-del" onClick={() => delFc(f.id)}>×</button></div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'assignments' && (
          <div className="card">
            <div className="sd-add-row"><input className="sd-input" placeholder="New task..." value={taskTitle} onChange={e => setTaskTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} /><button className="btn btn-primary" onClick={addTask}>Add</button></div>
            {subjTasks.length === 0 ? <div className="dash-empty">No tasks yet.</div> : (
              <div className="sd-item-list">{subjTasks.map(t => (
                <div key={t.id} className="sd-item">
                  <button className={`task-check ${t.completed ? 'checked' : ''}`} onClick={() => toggleTask(t)} style={t.completed ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}} />
                  <div className="sd-item-main"><strong className={t.completed ? 'done' : ''}>{t.title}</strong></div>
                  <button className="sd-del" onClick={() => delTask(t.id)}>×</button>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'exams' && (
          <div className="card">
            <div className="sd-add-row sd-add-col">
              <input className="sd-input" placeholder="Exam title" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
              <input type="date" className="sd-input" value={examDate} onChange={e => setExamDate(e.target.value)} />
              <button className="btn btn-primary" onClick={addExam}>Add Exam</button>
            </div>
            {subjExams.length === 0 ? <div className="dash-empty">No exams yet.</div> : (
              <div className="sd-item-list">{subjExams.map(e => (
                <div key={e.id} className="sd-item"><div className="sd-item-main"><strong>{e.title}</strong><span>{e.exam_date}</span></div>
                  <button className="sd-del" onClick={() => delExam(e.id)}>×</button></div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'resources' && (
          <div className="card">
            <div className="sd-add-row sd-add-col">
              <input className="sd-input" placeholder="Resource name" value={resName} onChange={e => setResName(e.target.value)} />
              <input className="sd-input" placeholder="URL (optional)" value={resUrl} onChange={e => setResUrl(e.target.value)} />
              <button className="btn btn-primary" onClick={addRes}>Add</button>
            </div>
            {resources.length === 0 ? <div className="dash-empty">No resources yet.</div> : (
              <div className="sd-item-list">{resources.map(r => (
                <div key={r.id} className="sd-item"><div className="sd-item-main"><strong>{r.name}</strong>{r.url && <a href={r.url} target="_blank" rel="noreferrer" className="sd-link">{r.url}</a>}</div>
                  <button className="sd-del" onClick={() => delRes(r.id)}>×</button></div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'chapters' && (
          <div className="card">
            <div className="sd-add-row"><input className="sd-input" placeholder="Chapter name" value={chapName} onChange={e => setChapName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChap()} /><button className="btn btn-primary" onClick={addChap}>Add</button></div>
            {chapters.length === 0 ? <div className="dash-empty">No chapters yet.</div> : (
              <div className="sd-item-list">{chapters.map(c => (
                <div key={c.id} className="sd-item">
                  <button className={`task-check ${c.done ? 'checked' : ''}`} onClick={() => toggleChap(c.id)} style={c.done ? { background: 'var(--primary)', borderColor: 'var(--primary)' } : {}} />
                  <div className="sd-item-main"><strong className={c.done ? 'done' : ''}>{c.name}</strong></div>
                  <button className="sd-del" onClick={() => delChap(c.id)}>×</button>
                </div>
              ))}</div>
            )}
          </div>
        )}

        {tab === 'time' && (
          <div className="card">
            <div className="card-head"><h3>Time Spent</h3></div>
            <div className="sd-big-stat"><span className="sd-big-num">{Math.floor(totalTime / 60)}h {totalTime % 60}m</span><span className="sd-big-label">total across {subjSessions.length} sessions</span></div>
            {subjSessions.length === 0 ? <div className="dash-empty">No sessions logged.</div> : (
              <div className="sd-item-list">{subjSessions.slice(0, 20).map(s => (
                <div key={s.id} className="sd-item"><div className="sd-item-main"><strong>{s.duration_minutes} min</strong>{s.notes && <span>{s.notes}</span>}<span className="sd-date">{s.session_date}</span></div></div>
              ))}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
