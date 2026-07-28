import { useState, useRef, useEffect } from 'react'
import './StubPages.css'

const SUGGESTIONS = [
  { icon: '📝', label: 'Summarize my notes' },
  { icon: '📅', label: 'Plan my study week' },
  { icon: '💡', label: 'Explain a concept' },
  { icon: '🎯', label: 'Quiz me on a topic' },
  { icon: '⚡', label: 'Motivate me' },
  { icon: '🔍', label: 'Find weak areas' },
]

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm your AI study assistant. I can help you plan, summarize, and stay motivated. What would you like to do today?", icon: '🤖' },
  ])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  const send = (text) => {
    const content = (text ?? input).trim()
    if (!content || busy) return
    setBusy(true)
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: content }])
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: "This feature is coming soon! 🚀 I'll be able to help you with that once AI assistance is enabled.", icon: '🤖' }])
      setBusy(false)
    }, 700)
  }

  return (
    <div className="ai-page">
      <div className="page-toolbar">
        <div>
          <h2>AI Assistant</h2>
          <p className="page-desc">Your personal study companion — powered by AI.</p>
        </div>
        <span className="stub-badge">Beta</span>
      </div>

      <div className="ai-chat">
        <div className="ai-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s.label} className="ai-suggestion-chip" onClick={() => send(s.label)} disabled={busy}>
              <span>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        <div className="ai-messages" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>
              {m.role === 'assistant' && <span className="ai-msg-avatar">{m.icon}</span>}
              <div className="ai-msg-bubble">{m.text}</div>
            </div>
          ))}
          {busy && <div className="ai-msg assistant"><span className="ai-msg-avatar">🤖</span><div className="ai-msg-bubble typing"><span /><span /><span /></div></div>}
        </div>

        <div className="ai-input-row">
          <input className="ai-input" placeholder="Ask me anything..." value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()} disabled={busy} />
          <button className="btn btn-primary ai-send" onClick={() => send()} disabled={busy || !input.trim()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" /></svg>
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
