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
  const scrollRef = useRef(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendMessage = (text) => {
    if (!text.trim()) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: 'This feature is coming soon! I\'ll be able to help you with study planning, exam prep, and more.' }])
    }, 500)
  }

  return (
    <div className="stub-page ai-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>AI Assistant</h2>
          <p className="page-desc">Your personal study companion — powered by AI.</p>
        </div>
      </div>

      <div className="ai-chat">
        <div className="ai-messages" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <span className="ai-welcome-icon">🤖</span>
              <h3>Hi! I'm your AI Study Assistant</h3>
              <p>Ask me anything about your studies, or try one of these suggestions:</p>
              <div className="ai-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="ai-suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`ai-message ${m.role}`}>
                <span className="ai-message-icon">{m.role === 'user' ? '🧑' : '🤖'}</span>
                <div className="ai-message-bubble"><p>{m.text}</p></div>
              </div>
            ))
          )}
        </div>

        <div className="ai-input-area">
          <input type="text" placeholder="Type your message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage(input)} className="ai-input" />
          <button className="btn btn-primary" onClick={() => sendMessage(input)}>Send</button>
        </div>
      </div>
    </div>
  )
}
