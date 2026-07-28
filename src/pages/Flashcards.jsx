import { useState, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { flashcards, subjects, refresh, addXp, unlockAchievement } = useApp()
  const [showForm, setShowForm] = useState(false)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [quizMode, setQuizMode] = useState(false)
  const [quizIdx, setQuizIdx] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)
  const [shuffled, setShuffled] = useState([])
  const [starredOnly, setStarredOnly] = useState(false)

  useEffect(() => {
    if (subjects.length > 0 && !subjectId) setSubjectId(subjects[0].id)
  }, [subjects, subjectId])

  const visibleCards = starredOnly ? flashcards.filter(f => f.starred) : flashcards

  const addCard = async () => {
    if (!front.trim() || !back.trim()) return
    await supabase.from('flashcards').insert({
      subject_id: subjectId || null, front: front.trim(), back: back.trim(),
    })
    setFront(''); setBack(''); setShowForm(false); refresh()
  }

  const toggleStar = async (f) => {
    await supabase.from('flashcards').update({ starred: !f.starred }).eq('id', f.id); refresh()
  }

  const deleteCard = async (id) => {
    await supabase.from('flashcards').delete().eq('id', id); refresh()
  }

  const reviewCard = async (f, correct) => {
    const ease = Math.max(130, Math.min(500, f.srs_ease + (correct ? 20 : -20)))
    const interval = correct ? Math.min(f.srs_interval * 2 + 1, 30) : 1
    const due = new Date()
    due.setDate(due.getDate() + interval)
    await supabase.from('flashcards').update({
      srs_interval: interval, srs_ease: ease, srs_due: due.toISOString().split('T')[0],
      review_count: f.review_count + 1,
    }).eq('id', f.id)
    await addXp(XP_REWARDS.flashcard_review)
    refresh()
  }

  const startQuiz = () => {
    const cards = [...visibleCards].sort(() => Math.random() - 0.5)
    setShuffled(cards); setQuizIdx(0); setShowAnswer(false); setQuizMode(true)
  }

  const nextCard = (correct) => {
    if (shuffled[quizIdx]) reviewCard(shuffled[quizIdx], correct)
    if (quizIdx + 1 < shuffled.length) {
      setQuizIdx(quizIdx + 1); setShowAnswer(false)
    } else {
      setQuizMode(false)
    }
  }

  const dueCards = flashcards.filter(f => f.srs_due <= todayStr())

  if (quizMode && shuffled.length > 0) {
    const card = shuffled[quizIdx]
    return (
      <div className="flashcards-page quiz-mode">
        <div className="quiz-header">
          <h3>Quiz Mode</h3>
          <span className="quiz-progress">{quizIdx + 1} / {shuffled.length}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setQuizMode(false)}>Exit</button>
        </div>
        <div className="quiz-card" onClick={() => setShowAnswer(!showAnswer)}>
          {!showAnswer ? (
            <>
              <span className="quiz-label">Question</span>
              <p className="quiz-text">{card.front}</p>
              <span className="quiz-hint">Click to reveal answer</span>
            </>
          ) : (
            <>
              <span className="quiz-label">Answer</span>
              <p className="quiz-text">{card.back}</p>
            </>
          )}
        </div>
        {showAnswer && (
          <div className="quiz-actions">
            <button className="btn btn-outline quiz-btn" onClick={() => nextCard(false)}>Didn't know</button>
            <button className="btn btn-primary quiz-btn" onClick={() => nextCard(true)}>Got it!</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <p className="page-desc">Create flashcards with spaced repetition. Quiz yourself and star difficult cards.</p>
        <div className="fc-toolbar-actions">
          <button className="btn btn-outline btn-sm" onClick={() => setStarredOnly(!starredOnly)}>{starredOnly ? 'Show all' : 'Starred only'}</button>
          <button className="btn btn-primary btn-sm" disabled={visibleCards.length === 0} onClick={startQuiz}>Quiz mode</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)}>+ New card</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="fc-due-banner">
          <span>📋 {dueCards.length} card{dueCards.length > 1 ? 's' : ''} due for review</span>
          <button className="btn btn-primary btn-sm" onClick={startQuiz}>Review now</button>
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <div className="form-head">
            <h3>New Flashcard</h3>
            <button className="close-btn" onClick={() => setShowForm(false)}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
          </div>
          <div className="form-field">
            <label>Front (question)</label>
            <input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="e.g. What is Newton's second law?" autoFocus />
          </div>
          <div className="form-field">
            <label>Back (answer)</label>
            <input type="text" value={back} onChange={e => setBack(e.target.value)} placeholder="e.g. F = ma" />
          </div>
          <div className="form-field">
            <label>Subject</label>
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div className="form-actions">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
            <button className="btn btn-primary btn-sm" onClick={addCard}>Add card</button>
          </div>
        </div>
      )}

      {visibleCards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'var(--primary-l)', color: 'var(--primary)' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M7 9h10M7 13h6" /></svg>
          </div>
          <h3>No flashcards yet</h3>
          <p>Create your first flashcard to start studying.</p>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>Create flashcard</button>
        </div>
      ) : (
        <div className="fc-list">
          {visibleCards.map(f => {
            const subj = subjects.find(s => s.id === f.subject_id)
            return (
              <div key={f.id} className="fc-item">
                <div className="fc-item-content">
                  <div className="fc-item-front">{f.front}</div>
                  <div className="fc-item-back">{f.back}</div>
                  <div className="fc-item-meta">
                    {subj && <span className="fc-item-sub" style={{ color: subj.color }}>{subj.icon} {subj.name}</span>}
                    <span className="fc-item-due">Due: {f.srs_due}</span>
                    <span className="fc-item-reviews">{f.review_count} reviews</span>
                  </div>
                </div>
                <div className="fc-item-actions">
                  <button className={`btn btn-ghost btn-sm ${f.starred ? 'starred' : ''}`} onClick={() => toggleStar(f)}>{f.starred ? '⭐' : '☆'}</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => deleteCard(f.id)}>Delete</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
