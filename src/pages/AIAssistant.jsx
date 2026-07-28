import { useState, useRef, useEffect } from 'react'
import './StubPages.css'

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [chips] = useState(['Help me plan my study schedule', 'What should I focus on?', 'Create a study plan for exams'])
  const listRef = useRef(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages])

  const send = (text) => {
    if (!text.trim()) return
    setMessages(prev => [...prev, { role: 'user', text }, { role: 'assistant', text: 'This feature is coming soon! I\'ll be able to help you with study planning, exam prep, and more.' }])
    setInput('')
  }

  return (
    <div className="ai-page">
      <div className="page-toolbar"><div><h2>AI Assistant</h2><p className="page-desc">Your personal study coach</p></div></div>
      <div className="ai-chat" ref={listRef}>
        {messages.length === 0 ? (
          <div className="ai-welcome"><span className="stub-icon-big">🤖</span><h3>Ask me anything about your studies</h3><div className="ai-chips">{chips.map((c, i) => <button key={i} className="ai-chip" onClick={() => send(c)}>{c}</button>)}</div></div>
        ) : (
          <div className="ai-messages">{messages.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}><span className="ai-msg-text">{m.text}</span></div>)}</div>
        )}
      </div>
      <div className="ai-input-row"><input value={input} onChange={e => setInput(e.target.value)} placeholder="Type a message..." onKeyDown={e => e.key === 'Enter' && send(input)} /><button className="btn btn-primary" onClick={() => send(input)}>Send</button></div>
    </div>
  )
}
