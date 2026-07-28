import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../lib/AppContext.jsx';
import { supabase } from '../lib/supabaseClient.js';
import { XP_REWARDS, todayStr } from '../lib/helpers.js';
import './FlashcardsPage.css';

export default function Flashcards() {
  const { profile, subjects, flashcards, refresh, addXp, unlockAchievement } = useApp();
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [quiz, setQuiz] = useState(false);
  const [deck, setDeck] = useState([]);
  const [qi, setQi] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const dueCards = useMemo(() => (flashcards || []).filter(c => !c.next_review || c.next_review <= todayStr()), [flashcards]);
  const visible = useMemo(() => (flashcards || []).filter(c => !starredOnly || c.starred), [flashcards, starredOnly]);

  const add = async () => {
    if (!front.trim() || !back.trim()) return;
    try {
      await supabase.from('flashcards').insert({
        subject_id: subjectId || null, front: front.trim(), back: back.trim(),
        starred: false, interval: 1, ease: 2.5, next_review: todayStr(),
        created_at: new Date().toISOString(),
      });
      setFront(''); setBack(''); refresh(); addXp(XP_REWARDS.flashcard_create || 5);
    } catch (e) { console.error(e); }
  };

  const del = async (id) => { await supabase.from('flashcards').delete().eq('id', id); refresh(); };
  const star = async (c) => { await supabase.from('flashcards').update({ starred: !c.starred }).eq('id', c.id); refresh(); };

  const startQuiz = () => {
    const shuffled = [...dueCards].sort(() => Math.random() - 0.5);
    setDeck(shuffled); setQi(0); setFlipped(false); setQuiz(true);
  };

  const answer = async (known) => {
    const card = deck[qi];
    if (!card) return;
    const ease = Math.max(1.3, (card.ease || 2.5) + (known ? 0.1 : -0.2));
    const interval = known ? Math.round((card.interval || 1) * ease) : 1;
    const next = new Date(); next.setDate(next.getDate() + interval);
    try {
      await supabase.from('flashcards').update({ ease, interval, next_review: next.toISOString().slice(0, 10) }).eq('id', card.id);
      if (known) { addXp(XP_REWARDS.flashcard_correct || 3); await unlockAchievement('quiz_master'); }
    } catch (e) { console.error(e); }
    if (qi + 1 < deck.length) { setQi(qi + 1); setFlipped(false); }
    else { setQuiz(false); refresh(); }
  };

  if (quiz && deck.length > 0) {
    const card = deck[qi];
    return (
      <div className="flashcards-page">
        <div className="page-toolbar"><div><h2>Quiz Mode</h2><p className="page-desc">Card {qi + 1} of {deck.length}</p></div>
          <button className="btn btn-ghost" onClick={() => setQuiz(false)}>Exit</button>
        </div>
        <div className="quiz-card" onClick={() => setFlipped(f => !f)}>
          {!flipped ? <div className="quiz-front"><div className="quiz-label">Front</div><div className="quiz-text">{card.front}</div></div>
            : <div className="quiz-back"><div className="quiz-label">Back</div><div className="quiz-text">{card.back}</div></div>}
        </div>
        <div className="quiz-actions">
          <button className="btn btn-outline" onClick={() => answer(false)}>Didn’t know</button>
          <button className="btn btn-primary" onClick={() => answer(true)}>Got it</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flashcards-page">
      <div className="page-toolbar">
        <div><h2>Flashcards</h2><p className="page-desc">{dueCards.length} due · {visible.length} total</p></div>
        <div className="toolbar-actions">
          <button className={`filter-chip ${starredOnly ? 'active' : ''}`} onClick={() => setStarredOnly(s => !s)}>⭐ Starred</button>
          <button className="btn btn-primary" onClick={startQuiz} disabled={dueCards.length === 0}>Start Quiz</button>
        </div>
      </div>

      {dueCards.length > 0 && (
        <div className="due-banner">📌 {dueCards.length} card{dueCards.length !== 1 ? 's' : ''} due for review</div>
      )}

      <div className="card form-card">
        <div className="form-row">
          <div className="form-field"><label>Front</label><input type="text" value={front} onChange={e => setFront(e.target.value)} placeholder="Question" /></div>
          <div className="form-field"><label>Back</label><input type="text" value={back} onChange={e => setBack(e.target.value)} placeholder="Answer" /></div>
        </div>
        <div className="form-field">
          <label>Subject</label>
          <select value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">General</option>
            {(subjects || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="form-actions"><button className="btn btn-primary" onClick={add}>Add Card</button></div>
      </div>

      <div className="fc-list">
        {visible.length === 0 && <div className="card empty-state"><div className="empty-icon">🎴</div><p>No flashcards yet</p></div>}
        {visible.map(c => {
          const subj = (subjects || []).find(s => s.id === c.subject_id);
          return (
            <div className="card fc-card" key={c.id}>
              <div className="fc-front">{c.front}</div>
              <div className="fc-back">{c.back}</div>
              <div className="fc-foot">
                {subj && <span className="chip" style={{ background: subj.color }}>{subj.name}</span>}
                <span className="fc-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => star(c)}>{c.starred ? '⭐' : '☆'}</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => del(c.id)}>🗑</button>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
