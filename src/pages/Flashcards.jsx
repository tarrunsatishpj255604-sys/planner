import { useState, useMemo, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { formatDate, todayStr, XP_REWARDS } from '../lib/helpers.js'
import './FlashcardsPage.css'

export default function Flashcards() {
  const { user, subjects, flashcards, refresh, addXp, unlockAchievement } = useApp()
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [busy, setBusy] = useState(false)
  const [starredOnly, setStarredOnly] = useState(false)
  const [quizMode, setQuizMode] = useState(false)

  const dueCards = useMemo(() => flashcards.filter(c => !c.next_review || c.next_review <= todayStr()), [flashcards])
  const visibleCards = useMemo(() => starredOnly ? flashcards.filter(c => c.starred) : flashcards, [flashcards, starredOnly])

  const addCard = async () => {
    if (!front.trim() || !back.trim() || busy) return
    setBusy(true)
    await supabase.from('flashcards').insert({
      user_id: user.id,
      subject_id: subjectId || null,
      front: front.trim(),
      back: back.trim(),
      review_count: 0,
      next_review: todayStr(),
      starred: false,
    })
    setFront(''); setBack(''); setBusy(false); refresh()
  }

  const remove = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh() }
  const toggleStar = async (c) => { await supabase.from('flashcards').update({ starred: !c.starred }).eq('id', c.id); refresh() }

  const review = async (c, known) => {
    const interval = known ? 3 : 1
    const next = new Date()
    next.setDate(next.getDate() + interval)
    await supabase.from('flashcards').update({
      review_count: (c.review_count || 0) + 1,
      next_review: next.toISOString().split('T')[0],
    }).eq('id', c.id)
    await addXp(XP_REWARDS.flashcard_review)
    await unlockAchievement('first_session')
    refresh()
    setQuizIdx(i => i + 1)
  }

  // Quiz state
  const [quizDeck, setQuizDeck] = useState([])
  const [quizIdx, setQuizIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const startQuiz = () => {
    const deck = [...dueCards].sort(() => Math.random() - 0.5)
    setQuizDeck(deck); setQuizIdx(0); setFlipped(false); setQuizMode(true)
  }
  useEffect(() => { setFlipped(false) }, [quizIdx])

  const current = quizDeck[quizIdx]
  const quizDone = quizMode && quizIdx >= quizDeck.length

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div>
          <h2>Flashcards</h2>
          <p className="page-desc">Create cards and review them with spaced repetition.</p>
        </div>
        <div className="fc-toolbar-right">
          <button className="filter-chip" onClick={() => setStarredOnly(v => !v)} style={starredOnly ? { background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' } : {}}>⭐ Starred only</button>
          <button className="btn btn-primary" onClick={startQuiz} disabled={dueCards.length === 0}>Quiz ({dueCards.length})</button>
        </div>
      </div>

      {dueCards.length > 0 && !quizMode && (
        <div className="fc-due-banner">
          <span>📌 You have <strong>{dueCards.length}</strong> cards due for review.</span>
          <button className="btn btn-primary btn-sm" onClick={startQuiz}>Start Quiz</button>
        </div>
      )}

      {quizMode ? (
        <div className="fc-quiz">
          {quizDone ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: '#e8f9ee', color: '#22c55e' }}>🎉</div>
              <h3>Quiz complete!</h3>
              <p>You reviewed {quizDeck.length} cards.</p>
              <button className="btn btn-primary" onClick={() => setQuizMode(false)}>Done</button>
            </div>
          ) : current ? (
            <div className="fc-quiz-card-wrap">
              <span className="fc-quiz-progress">{quizIdx + 1} / {quizDeck.length}</span>
              <div className={`fc-quiz-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
                <div className="fc-quiz-face front">
                  <span className="fc-quiz-label">Question</span>
                  <p className="fc-quiz-text">{current.front}</p>
                  <span className="fc-quiz-hint">Click to flip</span>
                </div>
                <div className="fc-quiz-face back">
                  <span className="fc-quiz-label">Answer</span>
                  <p className="fc-quiz-text">{current.back}</p>
                </div>
              </div>
              {flipped && (
                <div className="fc-quiz-actions">
                  <button className="btn btn-outline fc-quiz-btn miss" onClick={() => review(current, false)}>✗ Didn't know</button>
                  <button className="btn btn-primary fc-quiz-btn hit" onClick={() => review(current, true)}>✓ Got it</button>
                </div>
              )}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No cards to review</h3>
              <button className="btn btn-primary" onClick={() => setQuizMode(false)}>Back</button>
            </div>
          )}
          <button className="btn btn-ghost fc-quit-quiz" onClick={() => setQuizMode(false)}>Exit Quiz</button>
        </div>
      ) : (
        <>
          <div className="form-card">
            <div className="form-head"><h3>Add Flashcard</h3></div>
            <div className="form-row">
              <div className="form-field"><label>Front (question)</label><input value={front} onChange={(e) => setFront(e.target.value)} placeholder="What is..." /></div>
              <div className="form-field"><label>Back (answer)</label><input value={back} onChange={(e) => setBack(e.target.value)} placeholder="The answer is..." /></div>
            </div>
            <div className="form-field">
              <label>Subject</label>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                <option value="">No subject</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <div className="form-actions"><button className="btn btn-primary" onClick={addCard} disabled={busy}>Add Card</button></div>
          </div>

          {visibleCards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" style={{ background: '#e0f7fe', color: '#06b6d4' }}>🎴</div>
              <h3>No flashcards yet</h3>
              <p>{starredOnly ? 'No starred cards. Star difficult ones to find them here.' : 'Create your first card to start studying.'}</p>
            </div>
          ) : (
            <div className="fc-list">
              {visibleCards.map(c => (
                <div key={c.id} className="fc-list-card">
                  <div className="fc-list-main">
                    <div className="fc-list-front">{c.front}</div>
                    <div className="fc-list-back">{c.back}</div>
                    <div className="fc-list-meta">
                      {c.subject && <span className="fc-meta-chip" style={{ background: c.subject.color + '22', color: c.subject.color }}>{c.subject.icon} {c.subject.name}</span>}
                      <span className="fc-meta-chip">Reviews: {c.review_count || 0}</span>
                      {c.next_review && <span className="fc-meta-chip">Due: {formatDate(c.next_review)}</span>}
                    </div>
                  </div>
                  <div className="fc-list-actions">
                    <button className="fc-star" onClick={() => toggleStar(c)} title="Star">{c.starred ? '⭐' : '☆'}</button>
                    <button className="fc-list-delete" onClick={() => remove(c.id)}>×</button>
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
