import { useState, useMemo, useCallback, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS, formatDate } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, refresh, addXp, unlockAchievement, loading } = useApp()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [starredOnly, setStarredOnly] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizOrder, setQuizOrder] = useState([])

  const today = todayStr()
  const dueCards = useMemo(() => (flashcards || []).filter(f => !f.next_review || f.next_review <= today), [flashcards, today])
  const starredCards = useMemo(() => (flashcards || []).filter(f => f.starred), [flashcards])
  const displayCards = starredOnly ? starredCards : (flashcards || [])

  const startQuiz = () => {
    const shuffled = [...(dueCards.length > 0 ? dueCards : flashcards || [])].sort(() => Math.random() - 0.5)
    if (shuffled.length === 0) return
    setQuizOrder(shuffled); setQuizIdx(0); setFlipped(false); setQuizMode(true)
  }

  const quizCard = quizOrder[quizIdx]

  const reviewCard = useCallback(async (card, knewIt) => {
    const interval = knewIt ? 2 : 1
    const next = new Date(); next.setDate(next.getDate() + interval)
    const nextReview = next.toISOString().split('T')[0]
    const reviews = (card.review_count || 0) + 1
    await supabase.from('flashcards').update({ review_count: reviews, next_review: nextReview }).eq('id', card.id)
    await addXp(XP_REWARDS.flashcard_review)
    if (reviews >= 10) unlockAchievement('pomodoro_10')
    if (quizIdx + 1 < quizOrder.length) { setQuizIdx(quizIdx + 1); setFlipped(false) }
    else { setQuizMode(false); setQuizOrder([]); setQuizIdx(0); refresh() }
  }, [quizIdx, quizOrder, addXp, unlockAchievement, refresh])

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    const { data, error } = await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId || null }).select().single()
    if (!error && data) { setFront(''); setBack(''); setSubjectId(''); refresh() }
  }

  const toggleStar = async (card) => { await supabase.from('flashcards').update({ starred: !card.starred }).eq('id', card.id); refresh() }
  const deleteCard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  if (quizMode && quizCard) {
    return (
      <div className="flashcards-page quiz-mode">
        <div className="quiz-header">
          <span className="quiz-progress">Card {quizIdx + 1} / {quizOrder.length}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setQuizMode(false)}>✕ Exit</button>
        </div>
        <div className={`quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
          {!flipped ? (
            <div className="quiz-face quiz-front"><span className="quiz-label">Front</span><p className="quiz-text">{quizCard.front}</p><span className="quiz-hint">Click to flip</span></div>
          ) : (
            <div className="quiz-face quiz-back"><span className="quiz-label">Back</span><p className="quiz-text">{quizCard.back}</p><span className="quiz-hint">How did you do?</span></div>
          )}
        </div>
        {flipped && (
          <div className="quiz-actions">
            <button className="btn btn-outline quiz-btn" onClick={() => reviewCard(quizCard, false)}>❌ Didn't know</button>
            <button className="btn btn-primary quiz-btn" onClick={() => reviewCard(quizCard, true)}>✅ Got it</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div><h2>Flashcards</h2><p className="page-desc">Review and memorize with spaced repetition.</p></div>
        <button className="btn btn-primary" onClick={startQuiz} disabled={(flashcards || []).length === 0}>🎯 Start Quiz</button>
      </div>

      {dueCards.length > 0 && (
        <div className="due-banner"><span>📚 {dueCards.length} card{dueCards.length > 1 ? 's' : ''} due for review</span><button className="btn btn-primary btn-sm" onClick={startQuiz}>Review now</button></div>
      )}

      <div className="form-card">
        <div className="form-head"><h3>Add Flashcard</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Front (Question)</label><input type="text" placeholder="What is..." value={front} onChange={e => setFront(e.target.value)} /></div>
          <div className="form-field"><label>Back (Answer)</label><input type="text" placeholder="The answer is..." value={back} onChange={e => setBack(e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Subject</label><select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">None</option>{(subjects || []).map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}</select></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={addCard} disabled={!front.trim() || !back.trim()}>Add Card</button></div>
      </div>

      <div className="fc-filters">
        <button className={`filter-chip ${!starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(false)}>All Cards <span className="fc-count">{(flashcards || []).length}</span></button>
        <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(true)}>⭐ Starred <span className="fc-count">{starredCards.length}</span></button>
      </div>

      <div className="fc-grid">
        {displayCards.length === 0 ? (
          <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)' }}>🎴</div><h3>No flashcards</h3><p>Create cards above to start studying.</p></div>
        ) : displayCards.map(card => (
          <div key={card.id} className="fc-card">
            <div className="fc-card-top">
              <button className={`fc-star ${card.starred ? 'active' : ''}`} onClick={() => toggleStar(card)}>{card.starred ? '⭐' : '☆'}</button>
              <button className="btn btn-ghost btn-sm fc-delete" onClick={() => deleteCard(card.id)}>✕</button>
            </div>
            <div className="fc-card-front">{card.front}</div>
            <div className="fc-card-back">{card.back}</div>
            {card.subject && <span className="fc-card-subject" style={{ color: card.subject.color }}>{card.subject.icon} {card.subject.name}</span>}
          </div>
        ))}
      </div>
    </div>
  )
}
