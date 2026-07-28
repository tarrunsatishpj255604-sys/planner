import { useState, useMemo } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS, todayStr } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, refresh, addXp, unlockAchievement } = useApp()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)

  const dueCards = useMemo(() => flashcards.filter(f => !f.next_review || f.next_review <= todayStr()), [flashcards])

  const visibleCards = useMemo(() => {
    let list = flashcards
    if (starredOnly) list = list.filter(f => f.starred)
    return list
  }, [flashcards, starredOnly])

  const quizDeck = useMemo(() => {
    let deck = dueCards.length > 0 ? dueCards : flashcards
    if (starredOnly) deck = deck.filter(f => f.starred)
    return [...deck].sort(() => Math.random() - 0.5)
  }, [flashcards, dueCards, starredOnly])

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('flashcards').insert({ user_id: u.user.id, subject_id: subjectId || null, front: front.trim(), back: back.trim() })
    setFront(''); setBack('')
    refresh()
  }

  const deleteCard = async (id) => {
    await supabase.from('flashcards').delete().eq('id', id)
    refresh()
  }

  const toggleStar = async (f) => {
    await supabase.from('flashcards').update({ starred: !f.starred }).eq('id', f.id)
    refresh()
  }

  const reviewCard = async (f, knewIt) => {
    const intervals = knewIt ? [1, 3, 7, 14, 30] : [0, 1, 1, 1, 1]
    const level = Math.min((f.srs_level || 0) + (knewIt ? 1 : -1), 4)
    const nextLevel = Math.max(0, level)
    const nextDays = intervals[Math.max(0, nextLevel)]
    const nextDate = new Date(); nextDate.setDate(nextDate.getDate() + nextDays)
    await supabase.from('flashcards').update({ srs_level: nextLevel, next_review: nextDate.toISOString().split('T')[0] }).eq('id', f.id)
    await addXp(XP_REWARDS.flashcard_review)
    if (flashcards.length >= 10) unlockAchievement('pomodoro_10')
    refresh()
    setQuizIdx(i => i + 1)
    setFlipped(false)
  }

  const startQuiz = () => { setQuizMode(true); setQuizIdx(0); setFlipped(false) }
  const exitQuiz = () => { setQuizMode(false); setQuizIdx(0); setFlipped(false) }

  const getSubject = (id) => subjects.find(s => s.id === id)

  if (quizMode) {
    const card = quizDeck[quizIdx]
    if (!card) {
      return (
        <div className="flashcards-page">
          <div className="empty-state">
            <div className="empty-icon" style={{ background: 'var(--success-l)', fontSize: 28 }}>🎉</div>
            <h3>Quiz Complete!</h3>
            <p>You reviewed {quizIdx} cards.</p>
            <button className="btn btn-primary" onClick={exitQuiz}>Back to Cards</button>
          </div>
        </div>
      )
    }
    return (
      <div className="flashcards-page">
        <div className="page-toolbar">
          <div><h2>Quiz Mode</h2><p className="page-desc">Card {quizIdx + 1} of {quizDeck.length}</p></div>
          <button className="btn btn-ghost" onClick={exitQuiz}>✕ Exit</button>
        </div>
        <div className="quiz-progress-track"><div className="quiz-progress-fill" style={{ width: `${(quizIdx / quizDeck.length) * 100}%` }} /></div>
        <div className="quiz-card" onClick={() => setFlipped(!flipped)}>
          {!flipped ? (
            <div className="quiz-card-face">
              <span className="quiz-card-label">Front</span>
              <p className="quiz-card-text">{card.front}</p>
              <span className="quiz-card-hint">Click to flip</span>
            </div>
          ) : (
            <div className="quiz-card-face">
              <span className="quiz-card-label">Back</span>
              <p className="quiz-card-text">{card.back}</p>
            </div>
          )}
        </div>
        {flipped && (
          <div className="quiz-actions">
            <button className="btn btn-outline quiz-btn miss" onClick={() => reviewCard(card, false)}>✗ Didn't Know</button>
            <button className="btn btn-primary quiz-btn got" onClick={() => reviewCard(card, true)}>✓ Got It</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div><h2>Flashcards</h2><p className="page-desc">Create, study, and review flashcards with spaced repetition.</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(!starredOnly)}>⭐ Starred</button>
          <button className="btn btn-primary" onClick={startQuiz} disabled={flashcards.length === 0}>🎯 Start Quiz</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="due-banner">
          <span>📋 {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review</span>
          <button className="btn btn-primary btn-sm" onClick={startQuiz}>Review Now</button>
        </div>
      )}

      <form className="form-card" onSubmit={(e) => { e.preventDefault(); addCard() }}>
        <div className="form-row">
          <div className="form-field">
            <label>Front</label>
            <input value={front} onChange={(e) => setFront(e.target.value)} placeholder="Question" />
          </div>
          <div className="form-field">
            <label>Back</label>
            <input value={back} onChange={(e) => setBack(e.target.value)} placeholder="Answer" />
          </div>
        </div>
        <div className="form-row">
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="form-actions" style={{ alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">+ Add Card</button>
          </div>
        </div>
      </form>

      {visibleCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', fontSize: 28 }}>🎴</div>
          <h3>No flashcards</h3>
          <p>Create your first card to start studying.</p>
        </div>
      ) : (
        <div className="fc-card-grid">
          {visibleCards.map(f => {
            const sub = getSubject(f.subject_id)
            return (
              <div key={f.id} className="fc-card">
                <div className="fc-card-head">
                  {sub && <span className="fc-card-subject" style={{ color: sub.color }}>{sub.icon} {sub.name}</span>}
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleStar(f)}>{f.starred ? '⭐' : '☆'}</button>
                </div>
                <div className="fc-card-front">{f.front}</div>
                <div className="fc-card-back">{f.back}</div>
                <button className="btn btn-ghost btn-sm fc-card-del" onClick={() => deleteCard(f.id)}>🗑️ Delete</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
