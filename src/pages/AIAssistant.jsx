import { useState, useRef, useEffect } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

export default function AIAssistant() {
  const { subjects } = useApp()
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Hi! I\'m your AI study assistant. This feature is coming soon, but feel free to say hello!' }])
  const [input, setInput] = useState('')
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight) }, [messages])

  const suggestions = [
    'Help me plan my study schedule',
    'Explain a concept',
    'Quiz me on a topic',
    'Summarize my notes',
  ]

  const send = (text) => {
    const msg = text || input
    if (!msg.trim()) return
    setMessages([...messages, { role: 'user', content: msg }, { role: 'assistant', content: 'AI responses are coming soon! 🚧 This feature is under active development.' }])
    setInput('')
  }

  return (
    <div className="stub-page ai-page">
      <div className="page-toolbar">
        <div><h2>AI Assistant</h2><p className="page-desc">Your personal AI-powered study companion.</p></div>
      </div>
      <div className="ai-chat-container">
        <div className="ai-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-message ${m.role}`}>
              <div className="ai-avatar">{m.role === 'assistant' ? '🤖' : '🦊'}</div>
              <div className="ai-bubble">{m.content}</div>
            </div>
          ))}
        </div>
        <div className="ai-suggestions">
          {suggestions.map(s => (
            <button key={s} className="filter-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
        <div className="ai-input-row">
          <input className="ai-input" placeholder="Type a message..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()} />
          <button className="btn btn-primary" onClick={() => send()}>Send</button>
        </div>
      </div>
    </div>
  )
}
