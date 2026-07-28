import { useState, useRef, useEffect } from 'react'
import './StubPages.css'

const SUGGESTIONS = ['Summarize my notes', 'Create a study plan', 'Explain a concept', 'Quiz me']

export default function AIAssistant() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! I\'m your AI study assistant. This feature is coming soon, but I can suggest some things to try!' }])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const listRef = useRef(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages, typing])

  const send = (text) => {
    const msg = text.trim()
    if (!msg) return
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Thanks for your message! Full AI capabilities are coming soon. 🚀' }])
      setTyping(false)
    }, 800)
  }

  return (
    <div className="stub-page ai-page">
      <div className="ai-chat" ref={listRef}>
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.role}`}>
            <span className="ai-msg-avatar">{m.role === 'assistant' ? '🤖' : '🧑'}</span>
            <span className="ai-msg-text">{m.text}</span>
          </div>
        ))}
        {typing && <div className="ai-msg assistant"><span className="ai-msg-avatar">🤖</span><span className="ai-msg-text"><span className="ai-typing">●●●</span></span></div>}
      </div>

      {messages.length <= 1 && (
        <div className="ai-suggestions">
          {SUGGESTIONS.map(s => <button key={s} className="filter-chip" onClick={() => send(s)}>{s}</button>)}
        </div>
      )}

      <div className="ai-input-row">
        <input type="text" placeholder="Ask me anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} />
        <button className="btn btn-primary" onClick={() => send(input)}>Send</button>
      </div>
    </div>
  )
}
