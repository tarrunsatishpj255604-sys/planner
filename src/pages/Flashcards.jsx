import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { XP_REWARDS, todayStr } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { user, flashcards, subjects, addXp, unlockAchievement, refresh } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [quizMode, setQuizMode] = useState(false)
  const [quizCards, setQuizCards] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)

  const today = todayStr()
  const dueCards = useMemo(() => flashcards.filter(f => !f.next_review || f.next_review <= today), [flashcards, today])
  const visibleCards = starredOnly ? flashcards.filter(f => f.starred) : flashcards

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({ user_id: user.id, subject_id: subjectId || null, front: front.trim(), back: back.trim() })
    setFront(''); setBack(''); setSubjectId(''); refresh()
  }

  const deleteCard = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }

  const toggleStar = async (card) => { await supabase.from('flashcards').update({ starred: !card.starred }).eq('id', card.id); refresh() }

  const startQuiz = () => {
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5)
    setQuizCards(shuffled); setQuizIdx(0); setFlipped(false); setQuizMode(true)
  }

  const nextCard = () => { setFlipped(false); setQuizIdx(i => i + 1) }

  const reviewCard = async (card, knewIt) => {
    const interval = knewIt ? 2 : 1
    const next = new Date(); next.setDate(next.getDate() + interval)
    await supabase.from('flashcards').update({ review_count: (card.review_count || 0) + 1, next_review: next.toISOString().split('T')[0] }).eq('id', card.id)
    await addXp(XP_REWARDS.flashcard_review)
    await unlockAchievement('first_session')
    nextCard()
  }

  const currentCard = quizCards[quizIdx]

  useEffect(() => { if (quizMode && quizIdx >= quizCards.length) setQuizMode(false) }, [quizIdx, quizCards.length, quizMode])

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div>
          <h2>Flashcards</h2>
          <p className="page-desc">Create flashcards with spaced repetition. Quiz yourself and earn XP.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {dueCards.length > 0 && <button className="btn btn-outline" onClick={startQuiz}>🎯 Quiz ({dueCards.length})</button>}
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add Card'}</button>
        </div>
      </div>

      {dueCards.length > 0 && !quizMode && (
        <div className="fc-due-banner" style={{ background: 'var(--warning-l)' }}>
          <span>📚 {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review</span>
          <button className="btn btn-sm btn-primary" onClick={startQuiz}>Review Now</button>
        </div>
      )}

      {quizMode && currentCard ? (
        <div className="fc-quiz">
          <div className="fc-quiz-header">
            <span>Card {quizIdx + 1} / {quizCards.length}</span>
            <button className="btn btn-sm btn-ghost" onClick={() => setQuizMode(false)}>Exit Quiz</button>
          </div>
          <div className={`fc-quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>
            <div className="fc-quiz-face fc-quiz-front">
              <span className="fc-quiz-label">Front</span>
              <p className="fc-quiz-text">{currentCard.front}</p>
              <span className="fc-quiz-hint">Click to flip</span>
            </div>
            <div className="fc-quiz-face fc-quiz-back">
              <span className="fc-quiz-label">Back</span>
              <p className="fc-quiz-text">{currentCard.back}</p>
              <span className="fc-quiz-hint">Click to flip</span>
            </div>
          </div>
          {flipped && (
            <div className="fc-quiz-actions">
              <button className="btn btn-outline fc-didnt" onClick={() => reviewCard(currentCard, false)}>Didn't Know</button>
              <button className="btn btn-primary fc-gotit" onClick={() => reviewCard(currentCard, true)}>Got It</button>
            </div>
          )}
        </div>
      ) : (
        <>
          {showForm && (
            <div className="form-card">
              <div className="form-head"><h3>New Flashcard</h3></div>
              <div className="form-row">
                <div className="form-field">
                  <label>Front (Question)</label>
                  <textarea rows={3} placeholder="What is..." value={front} onChange={e => setFront(e.target.value)} autoFocus />
                </div>
                <div className="form-field">
                  <label>Back (Answer)</label>
                  <textarea rows={3} placeholder="The answer is..." value={back} onChange={e => setBack(e.target.value)} />
                </div>
              </div>
              <div className="form-field">
                <label>Subject</label>
                <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
                  <option value="">No subject</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                </select>
              </div>
              <div className="form-actions">
                <button className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={addCard}>Add Card</button>
              </div>
            </div>
          )}

          <div className="fc-toolbar">
            <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(!starredOnly)}>⭐ Starred Only</button>
          </div>

          {visibleCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>🃏</div>
              <h3>No flashcards yet</h3>
              <p>Create your first flashcard to start studying.</p>
            </div>
          ) : (
            <div className="fc-card-grid">
              {visibleCards.map(card => (
                <div key={card.id} className="fc-list-card">
                  <div className="fc-list-front">{card.front}</div>
                  <div className="fc-list-back">{card.back}</div>
                  {card.subject && <span className="fc-list-sub" style={{ background: card.subject.color + '20', color: card.subject.color }}>{card.subject.icon} {card.subject.name}</span>}
                  <div className="fc-list-actions">
                    <button className="btn btn-sm btn-ghost" onClick={() => toggleStar(card)}>{card.starred ? '⭐' : '☆'}</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => deleteCard(card.id)}>🗑️</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
