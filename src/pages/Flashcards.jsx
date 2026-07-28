import { useState, useMemo, useRef, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
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
  const [quizResults, setQuizResults] = useState({ correct: 0, total: 0 })
  const reviewCountRef = useRef(0)

  const today = todayStr()
  const dueCards = useMemo(() => flashcards.filter(f => f.srs_due && f.srs_due <= today), [flashcards, today])
  const displayedCards = useMemo(() => {
    let list = flashcards
    if (starredOnly) list = list.filter(f => f.starred)
    return list
  }, [flashcards, starredOnly])

  const addCard = async () => {
    if (!front.trim()) return
    await supabase.from('flashcards').insert({ front: front.trim(), back: back.trim(), subject_id: subjectId || null, srs_interval: 1, srs_ease: 250, srs_due: todayStr(), review_count: 0, starred: false })
    setFront(''); setBack(''); refresh()
  }

  const deleteCard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const toggleStar = async (card) => {
    await supabase.from('flashcards').update({ starred: !card.starred }).eq('id', card.id)
    refresh()
  }

  const shuffle = (arr) => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  const startQuiz = () => {
    const pool = dueCards.length > 0 ? dueCards : flashcards
    if (pool.length === 0) return
    setQuizCards(shuffle(pool))
    setQuizIdx(0); setFlipped(false); setQuizResults({ correct: 0, total: pool.length })
    setQuizMode(true)
    reviewCountRef.current = 0
  }

  const reviewCard = async (gotIt) => {
    const card = quizCards[quizIdx]
    if (!card) return
    reviewCountRef.current++
    let newInterval, newEase
    if (gotIt) {
      newInterval = (card.srs_interval || 1) * 2
      newEase = (card.srs_ease || 250) + 20
    } else {
      newInterval = 1
      newEase = (card.srs_ease || 250) - 20
    }
    const newDue = new Date()
    newDue.setDate(newDue.getDate() + newInterval)
    await supabase.from('flashcards').update({ srs_interval: newInterval, srs_ease: newEase, srs_due: newDue.toISOString().split('T')[0], review_count: (card.review_count || 0) + 1 }).eq('id', card.id)

    if (gotIt) setQuizResults(prev => ({ ...prev, correct: prev.correct + 1 }))

    if (reviewCountRef.current >= 10) {
      await addXp(XP_REWARDS.flashcard_review)
      await unlockAchievement('fc_review_10')
      reviewCountRef.current = 0
    }

    if (quizIdx + 1 < quizCards.length) {
      setQuizIdx(quizIdx + 1); setFlipped(false)
    } else {
      setQuizMode(false); refresh()
    }
  }

  if (loading) return <div className="dash-loading"><div className="spinner" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>

  if (quizMode) {
    const card = quizCards[quizIdx]
    if (!card) return null
    return (
      <div className="flashcards-page">
        <div className="page-toolbar">
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Quiz Mode</h2>
            <p className="page-desc">Card {quizIdx + 1} of {quizCards.length} · Score: {quizResults.correct}</p>
          </div>
          <button className="btn btn-ghost" onClick={() => setQuizMode(false)}>Exit Quiz</button>
        </div>
        <div className="quiz-progress-bar">
          <div className="quiz-progress-fill" style={{ width: `${((quizIdx) / quizCards.length) * 100}%` }} />
        </div>
        <div className="quiz-card-area">
          <div className={`quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="quiz-card-face front">
              <span className="quiz-card-label">Front</span>
              <p className="quiz-card-text">{card.front}</p>
              <span className="quiz-card-hint">Click to flip</span>
            </div>
            <div className="quiz-card-face back">
              <span className="quiz-card-label">Back</span>
              <p className="quiz-card-text">{card.back}</p>
              <span className="quiz-card-hint">Click to flip</span>
            </div>
          </div>
        </div>
        <div className="quiz-actions">
          <button className="btn btn-outline quiz-btn miss" onClick={() => reviewCard(false)}>✗ Didn't Know</button>
          <button className="btn btn-primary quiz-btn got" onClick={() => reviewCard(true)}>✓ Got It</button>
        </div>
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Flashcards</h2>
          <p className="page-desc">Spaced repetition cards to help you memorize faster.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={startQuiz} disabled={flashcards.length === 0}>🎯 Start Quiz</button>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Card'}</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="fc-due-banner">
          <span>📋 {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review today</span>
          <button className="btn btn-primary btn-sm" onClick={startQuiz}>Review Now</button>
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <div className="form-head"><h3>New Flashcard</h3></div>
          <div className="form-field">
            <label>Front (Question)</label>
            <textarea placeholder="What is the capital of France?" value={front} onChange={e => setFront(e.target.value)} rows="2" autoFocus />
          </div>
          <div className="form-field">
            <label>Back (Answer)</label>
            <textarea placeholder="Paris" value={back} onChange={e => setBack(e.target.value)} rows="2" />
          </div>
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={addCard} disabled={!front.trim()}>Add Card</button>
          </div>
        </div>
      )}

      <div className="fc-filters">
        <button className={`filter-chip ${!starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(false)}>All Cards <span className="fc-count">{flashcards.length}</span></button>
        <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(true)}>⭐ Starred <span className="fc-count">{flashcards.filter(f => f.starred).length}</span></button>
      </div>

      {displayedCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>🃏</div>
          <h3>No flashcards yet</h3>
          <p>Create your first flashcard to start studying.</p>
        </div>
      ) : (
        <div className="fc-grid">
          {displayedCards.map(card => (
            <div key={card.id} className="card fc-card">
              <div className="fc-card-head">
                {card.subject && <span className="fc-card-subject" style={{ color: card.subject.color, background: `${card.subject.color}15` }}>{card.subject.name}</span>}
                <button className={`fc-star-btn ${card.starred ? 'starred' : ''}`} onClick={() => toggleStar(card)}>{card.starred ? '⭐' : '☆'}</button>
              </div>
              <div className="fc-card-front">{card.front}</div>
              <div className="fc-card-back">{card.back}</div>
              {card.srs_due && <span className="fc-card-due">Due: {card.srs_due <= today ? 'Now' : card.srs_due}</span>}
              <button className="fc-del-btn" onClick={() => deleteCard(card.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
