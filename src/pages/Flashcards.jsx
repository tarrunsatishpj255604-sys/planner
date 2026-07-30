import { useState, useEffect, useCallback } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, loading, refresh, addXp, unlockAchievement } = useApp()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [filterStarred, setFilterStarred] = useState(false)
  const [quizMode, setQuizMode] = useState(false)
  const [quizCards, setQuizCards] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 })
  const [reviewCount, setReviewCount] = useState(0)

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)', width: 28, height: 28 }} /></div>

  const dueCards = flashcards.filter(fc => {
    if (!fc.srs_due) return false
    return fc.srs_due <= todayStr()
  })

  const displayCards = filterStarred ? flashcards.filter(fc => fc.starred) : flashcards

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId || null, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    if (flashcards.length === 0) await unlockAchievement('fc_10')
    setFront(''); setBack(''); setSubjectId(''); refresh()
  }

  const del = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const toggleStar = async (fc) => {
    await supabase.from('flashcards').update({ starred: !fc.starred }).eq('id', fc.id)
    refresh()
  }

  const startQuiz = () => {
    const cards = [...(filterStarred ? displayCards : flashcards)]
    if (cards.length === 0) return
    const shuffled = cards.sort(() => Math.random() - 0.5)
    setQuizCards(shuffled)
    setQuizIdx(0)
    setFlipped(false)
    setQuizScore({ correct: 0, total: shuffled.length })
    setQuizMode(true)
    setReviewCount(0)
  }

  const reviewCard = async (known) => {
    const card = quizCards[quizIdx]
    if (!card) return
    const newEase = Math.max(130, Math.min(250, (card.srs_ease || 250) + (known ? 10 : -20)))
    const newInterval = known ? Math.max(1, Math.round((card.srs_interval || 1) * newEase / 100)) : 1
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + newInterval)
    await supabase.from('flashcards').update({
      srs_interval: newInterval,
      srs_ease: newEase,
      srs_due: dueDate.toISOString().split('T')[0],
      review_count: (card.review_count || 0) + 1,
    }).eq('id', card.id)

    const newReviewCount = reviewCount + 1
    setReviewCount(newReviewCount)

    if (known) setQuizScore(prev => ({ ...prev, correct: prev.correct + 1 }))
    await addXp(XP_REWARDS.flashcard_review)
    if (newReviewCount >= 10) await unlockAchievement('fc_review_10')

    if (quizIdx + 1 < quizCards.length) {
      setQuizIdx(quizIdx + 1)
      setFlipped(false)
    } else {
      setQuizMode(false)
      refresh()
    }
  }

  if (quizMode && quizCards.length > 0) {
    const card = quizCards[quizIdx]
    return (
      <div className="flashcards-page">
        <div className="page-toolbar">
          <div><h2>Quiz Mode</h2><p className="page-desc">Card {quizIdx + 1} of {quizCards.length} · Score: {quizScore.correct}</p></div>
          <button className="btn btn-ghost" onClick={() => setQuizMode(false)}>Exit Quiz</button>
        </div>
        <div className="quiz-progress-bar"><div className="quiz-progress-fill" style={{ width: `${((quizIdx) / quizCards.length) * 100}%` }} /></div>
        <div className="quiz-card-container">
          <div className={`quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
            <div className="quiz-card-face quiz-card-front">
              <span className="quiz-card-label">Question</span>
              <p className="quiz-card-text">{card.front}</p>
              <span className="quiz-card-hint">Click to flip</span>
            </div>
            <div className="quiz-card-face quiz-card-back">
              <span className="quiz-card-label">Answer</span>
              <p className="quiz-card-text">{card.back}</p>
              <span className="quiz-card-hint">Click to flip back</span>
            </div>
          </div>
        </div>
        <div className="quiz-buttons">
          <button className="btn btn-outline quiz-btn" onClick={() => reviewCard(false)} disabled={!flipped}>✗ Didn't Know</button>
          <button className="btn btn-primary quiz-btn" onClick={() => reviewCard(true)} disabled={!flipped}>✓ Got It</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div><h2>Flashcards</h2><p className="page-desc">Create cards with spaced repetition. Quiz yourself and track review schedules.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-outline ${filterStarred ? 'active' : ''}`} onClick={() => setFilterStarred(s => !s)}>{filterStarred ? '★ Starred' : '☆ Starred Only'}</button>
          <button className="btn btn-primary" onClick={startQuiz} disabled={flashcards.length === 0}>🎯 Start Quiz</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="due-banner">
          <span>📚 {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review</span>
          <button className="btn btn-sm" onClick={startQuiz} style={{ background: '#fff', color: 'var(--warning)' }}>Review Now</button>
        </div>
      )}

      <div className="form-card">
        <div className="form-head"><h3>Add Flashcard</h3></div>
        <div className="form-row">
          <div className="form-field"><label>Front (Question)</label><input type="text" placeholder="What is..." value={front} onChange={e => setFront(e.target.value)} /></div>
          <div className="form-field"><label>Back (Answer)</label><input type="text" placeholder="The answer is..." value={back} onChange={e => setBack(e.target.value)} /></div>
        </div>
        <div className="form-field"><label>Subject</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">No subject</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
          </select>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={addCard} disabled={!front.trim() || !back.trim()}>Add Card</button></div>
      </div>

      {displayCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)', fontSize: 28 }}>🃏</div>
          <h3>{filterStarred ? 'No starred cards' : 'No flashcards yet'}</h3>
          <p>{filterStarred ? 'Star cards to find them quickly.' : 'Create your first flashcard to start studying.'}</p>
        </div>
      ) : (
        <div className="fc-grid">
          {displayCards.map(fc => {
            const subj = subjects.find(s => s.id === fc.subject_id)
            const isDue = fc.srs_due && fc.srs_due <= todayStr()
            return (
              <div key={fc.id} className="fc-card">
                <div className="fc-card-top">
                  <span className="fc-front">{fc.front}</span>
                  <button className="fc-star" onClick={() => toggleStar(fc)}>{fc.starred ? '⭐' : '☆'}</button>
                </div>
                <div className="fc-divider" />
                <p className="fc-back">{fc.back}</p>
                <div className="fc-meta">
                  {subj && <span className="fc-subject" style={{ background: subj.color + '22', color: subj.color }}>{subj.icon} {subj.name}</span>}
                  {isDue && <span className="fc-due">Due</span>}
                  <span className="fc-reviews">{fc.review_count || 0} reviews</span>
                  <button className="btn btn-ghost btn-sm fc-delete" onClick={() => del(fc.id)}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
