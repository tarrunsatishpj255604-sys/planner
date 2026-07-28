import { useState, useEffect, useRef } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, loading, refresh, addXp, unlockAchievement } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizCards, setQuizCards] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const quizTimer = useRef(null)

  const today = todayStr()
  const dueCards = flashcards.filter(f => (f.srs_due || today) <= today)
  const visible = starredOnly ? flashcards.filter(f => f.starred) : flashcards

  useEffect(() => () => clearInterval(quizTimer.current), [])

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId || null, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    setFront(''); setBack(''); setSubjectId(''); refresh()
  }

  const del = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const toggleStar = async (f) => { await supabase.from('flashcards').update({ starred: !f.starred }).eq('id', f.id); refresh() }

  const startQuiz = () => {
    const pool = dueCards.length > 0 ? dueCards : flashcards
    if (pool.length === 0) return
    setQuizCards([...pool].sort(() => Math.random() - 0.5))
    setQuizIdx(0); setFlipped(false); setReviewCount(0); setQuizMode(true)
  }

  const endQuiz = () => { setQuizMode(false); setQuizCards([]); setQuizIdx(0); setFlipped(false) }

  const reviewCard = async (gotIt) => {
    const card = quizCards[quizIdx]
    if (!card) return
    let interval = card.srs_interval || 1
    let ease = card.srs_ease || 250
    if (gotIt) { interval = interval * 2; ease = ease + 20 }
    else { interval = 1; ease = Math.max(130, ease - 20) }
    const due = new Date(); due.setDate(due.getDate() + interval)
    await supabase.from('flashcards').update({ srs_interval: interval, srs_ease: ease, srs_due: due.toISOString().split('T')[0], review_count: (card.review_count || 0) + 1 }).eq('id', card.id)
    const newCount = reviewCount + 1
    setReviewCount(newCount)
    await addXp(XP_REWARDS.flashcard_review)
    if (newCount >= 10) await unlockAchievement('fc_review_10')
    if (quizIdx + 1 < quizCards.length) { setQuizIdx(quizIdx + 1); setFlipped(false) }
    else { refresh(); endQuiz() }
  }

  if (loading) return <div className="fc-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  if (quizMode) {
    const card = quizCards[quizIdx]
    return (
      <div className="fc-quiz">
        <div className="quiz-top">
          <span className="quiz-progress">{quizIdx + 1} / {quizCards.length}</span>
          <button className="btn btn-ghost btn-sm" onClick={endQuiz}>✕ Exit</button>
        </div>
        <div className={`quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
          <div className="quiz-card-inner">
            <div className="quiz-card-face quiz-front">
              <span className="quiz-face-label">Question</span>
              <p>{card?.front}</p>
              <span className="quiz-hint">Click to flip</span>
            </div>
            <div className="quiz-card-face quiz-back">
              <span className="quiz-face-label">Answer</span>
              <p>{card?.back}</p>
            </div>
          </div>
        </div>
        {flipped ? (
          <div className="quiz-actions">
            <button className="btn btn-outline quiz-btn miss" onClick={() => reviewCard(false)}>Didn't know</button>
            <button className="btn btn-primary quiz-btn got" onClick={() => reviewCard(true)}>Got it</button>
          </div>
        ) : (
          <div className="quiz-hint-bottom">Flip the card to reveal the answer</div>
        )}
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div><h2 className="page-title">Flashcards</h2><p className="page-desc">Spaced repetition for better memory.</p></div>
        <div className="fc-toolbar-btns">
          <button className="btn btn-outline" onClick={startQuiz} disabled={flashcards.length === 0}>🃏 Quiz ({dueCards.length} due)</button>
          <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>{showForm ? 'Cancel' : '+ Add Card'}</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="due-banner">📚 {dueCards.length} card{dueCards.length > 1 ? 's' : ''} due for review today!</div>
      )}

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Flashcard</h3></div>
          <div className="form-field"><label>Front (Question)</label><textarea value={front} onChange={e => setFront(e.target.value)} rows={2} placeholder="e.g. What is the capital of France?" /></div>
          <div className="form-field"><label>Back (Answer)</label><textarea value={back} onChange={e => setBack(e.target.value)} rows={2} placeholder="e.g. Paris" /></div>
          <div className="form-field"><label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">None</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-actions"><button className="btn btn-primary" onClick={addCard} disabled={!front.trim() || !back.trim()}>Add Card</button></div>
        </div>
      )}

      <div className="filter-row">
        <button className={`filter-chip ${!starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(false)}>All <span className="fc-count">{flashcards.length}</span></button>
        <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(true)}>⭐ Starred <span className="fc-count">{flashcards.filter(f => f.starred).length}</span></button>
      </div>

      {visible.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>🃏</div><h3>No flashcards</h3><p>Create cards or start a quiz.</p></div>
      ) : (
        <div className="fc-grid">
          {visible.map(f => (
            <div key={f.id} className="fc-card">
              <button className={`fc-star ${f.starred ? 'active' : ''}`} onClick={() => toggleStar(f)}>{f.starred ? '⭐' : '☆'}</button>
              <div className="fc-front"><span className="fc-label">Q</span><p>{f.front}</p></div>
              <div className="fc-back"><span className="fc-label">A</span><p>{f.back}</p></div>
              <div className="fc-foot">{f.subject && <span className="fc-subj" style={{ color: f.subject.color }}>{f.subject.name}</span>}<button className="fc-del" onClick={() => del(f.id)}>×</button></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
