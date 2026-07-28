import { useState, useRef, useEffect } from 'react'
import './StubPages.css'

const SUGGESTIONS = [
  'Summarize my notes',
  'Create a study plan',
  'Explain a concept',
  'Generate flashcards',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I\'m your AI study assistant. This feature is coming soon — I\'ll be able to help you summarize notes, create study plans, and more!' }])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => { listRef.current?.scrollTo(0, listRef.current.scrollHeight) }, [messages])

  const send = (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages(prev => [...prev, { role: 'user', text: msg }, { role: 'assistant', text: 'This feature is coming soon! 🚀' }])
    setInput('')
  }

  return (
    <div className="stub-page ai-page">
      <div className="ai-header">
        <div className="stub-hero-icon">🤖</div>
        <div>
          <h1>AI Assistant</h1>
          <p className="stub-tagline">Your personal AI study companion — coming soon!</p>
        </div>
      </div>
      <div className="ai-suggestions">
        {SUGGESTIONS.map(s => <button key={s} className="ai-suggestion-chip" onClick={() => send(s)}>{s}</button>)}
      </div>
      <div className="ai-chat">
        <div className="ai-messages" ref={listRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              <span className="ai-msg-text">{m.text}</span>
            </div>
          ))}
        </div>
        <div className="ai-input-row">
          <input type="text" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn btn-primary" onClick={() => send()}>Send</button>
        </div>
      </div>
    </div>
  )
}
