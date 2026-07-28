import { useState, useRef, useEffect } from 'react'
import './StubPages.css'

const SUGGESTIONS = [
  'Help me plan my study schedule',
  'What should I focus on?',
  'Create a study plan for exams',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const listRef = useRef(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages])

  const send = (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages(m => [...m, { role: 'user', text: msg }])
    setInput('')
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: "This feature is coming soon! I'll be able to help you with study planning, exam prep, and more." }])
    }, 400)
  }

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="ai-header-icon">🤖</div>
        <div><h1>AI Study Assistant</h1><p className="stub-subtitle">Your personal AI study companion.</p></div>
      </div>
      <div className="ai-chat-card">
        <div className="ai-messages" ref={listRef}>
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">✨</div>
              <h3>How can I help you study?</h3>
              <p>Try one of these suggestions:</p>
              <div className="ai-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="ai-suggestion-chip" onClick={() => send(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`ai-message ${m.role}`}>
                <span className="ai-msg-icon">{m.role === 'user' ? '🧑' : '🤖'}</span>
                <div className="ai-msg-bubble">{m.text}</div>
              </div>
            ))
          )}
        </div>
        <div className="ai-input-row">
          <input className="ai-input" placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} />
          <button className="btn btn-primary" onClick={() => send()} disabled={!input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
