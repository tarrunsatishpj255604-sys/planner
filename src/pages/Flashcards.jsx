import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, ACHIEVEMENT_DEFS } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, addXp, unlockAchievement, refresh } = useApp()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [showQuiz, setShowQuiz] = useState(false)
  const [quizCards, setQuizCards] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizScore, setQuizScore] = useState(0)
  const [quizDone, setQuizDone] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)

  const today = todayStr()
  const dueCards = flashcards.filter(f => f.srs_due <= today)
  const displayed = starredOnly ? flashcards.filter(f => f.starred) : flashcards

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId || null, srs_interval: 1, srs_ease: 250, srs_due: today, review_count: 0, starred: false }).select().single()
    setFront(''); setBack(''); setSubjectId(''); refresh()
  }

  const deleteCard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const toggleStar = async (card) => { await supabase.from('flashcards').update({ starred: !card.starred }).eq('id', card.id); refresh() }

  const startQuiz = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setQuizCards(shuffled); setQuizIdx(0); setFlipped(false); setQuizScore(0); setQuizDone(false); setShowQuiz(true)
  }

  const answerCard = async (gotIt) => {
    const card = quizCards[quizIdx]
    let newInterval = gotIt ? (card.srs_interval || 1) * 2 : 1
    let newEase = gotIt ? (card.srs_ease || 250) + 20 : (card.srs_ease || 250) - 20
    const dueDate = new Date(); dueDate.setDate(dueDate.getDate() + newInterval)
    await supabase.from('flashcards').update({ srs_interval: newInterval, srs_ease: newEase, srs_due: dueDate.toISOString().split('T')[0], review_count: (card.review_count || 0) + 1 }).eq('id', card.id)
    if (gotIt) setQuizScore(quizScore + 1)
    if (quizIdx + 1 >= quizCards.length) { setQuizDone(true); addXp(5); unlockAchievement('fc_review_10'); refresh() }
    else { setQuizIdx(quizIdx + 1); setFlipped(false) }
  }

  if (showQuiz) {
    if (quizDone) {
      return (
        <div className="fc-quiz-done">
          <div className="fc-quiz-result"><span className="fc-quiz-score">{quizScore} / {quizCards.length}</span><span className="fc-quiz-label">Correct!</span></div>
          <button className="btn btn-primary" onClick={() => { setShowQuiz(false); refresh() }}>Done</button>
        </div>
      )
    }
    const card = quizCards[quizIdx]
    if (!card) { setShowQuiz(false); return null }
    return (
      <div className="fc-quiz-page">
        <div className="fc-quiz-header"><span>Card {quizIdx + 1} of {quizCards.length}</span><button className="btn btn-ghost btn-sm" onClick={() => setShowQuiz(false)}>Exit</button></div>
        <div className={`fc-quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
          <div className="fc-quiz-front"><span className="fc-quiz-label-sm">Question</span><p>{card.front}</p><span className="fc-quiz-hint">Click to flip</span></div>
          <div className="fc-quiz-back"><span className="fc-quiz-label-sm">Answer</span><p>{card.back}</p></div>
        </div>
        {flipped && <div className="fc-quiz-buttons"><button className="btn btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }} onClick={() => answerCard(false)}>Didn't Know</button><button className="btn btn-primary" onClick={() => answerCard(true)}>Got It!</button></div>}
      </div>
    )
  }

  return (
    <div className="fc-page">
      <div className="page-toolbar"><div><h2>Flashcards</h2><p className="page-desc">Create and review flashcards with spaced repetition</p></div>{flashcards.length > 0 && <button className="btn btn-primary" onClick={startQuiz}>Start Quiz</button>}</div>

      {dueCards.length > 0 && <div className="fc-due-banner">📚 {dueCards.length} card{dueCards.length > 1 ? 's' : ''} due for review — <button className="link-btn" onClick={startQuiz}>Review now</button></div>}

      <div className="form-card">
        <h3>Add Flashcard</h3>
        <div className="form-field"><label>Front (Question)</label><textarea value={front} onChange={e => setFront(e.target.value)} placeholder="What is..." rows={2} /></div>
        <div className="form-field"><label>Back (Answer)</label><textarea value={back} onChange={e => setBack(e.target.value)} placeholder="The answer is..." rows={2} /></div>
        <div className="form-field"><label>Subject</label><select value={subjectId} onChange={e => setSubjectId(e.target.value)}><option value="">No subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
        <div className="form-actions"><button className="btn btn-primary" onClick={addCard}>Add Card</button></div>
      </div>

      <div className="filter-row"><button className={`filter-chip ${!starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(false)}>All<span className="fc-count">{flashcards.length}</span></button><button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(true)}>⭐ Starred<span className="fc-count">{flashcards.filter(f => f.starred).length}</span></button></div>

      {displayed.length === 0 ? (
        <div className="empty-state"><div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>🃏</div><h3>No flashcards yet</h3><p>Create your first card above.</p></div>
      ) : (
        <div className="fc-grid">
          {displayed.map(card => (
            <div key={card.id} className="fc-card">
              <div className="fc-card-top"><button className="fc-star" onClick={() => toggleStar(card)} style={{ color: card.starred ? 'var(--warning)' : 'var(--text-3)' }}>★</button><button className="fc-del" onClick={() => deleteCard(card.id)}>×</button></div>
              <div className="fc-card-front">{card.front}</div>
              <div className="fc-card-back">{card.back}</div>
              {card.subject && <span className="fc-card-sub">{card.subject.name}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
