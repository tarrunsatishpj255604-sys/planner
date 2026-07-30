import { useState, useRef, useEffect } from 'react'
import './AIAssistant.css'

const SUGGESTIONS = [
  'How do I improve my study habits?',
  'Create a study plan for exams',
  'Tips for staying focused',
  'Help me with time management',
]

export default function AIAssistant() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = (text) => {
    const content = text || input
    if (!content.trim()) return
    setMessages(prev => [...prev, { role: 'user', content: content.trim() }])
    setInput('')
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'assistant', content: 'This feature is coming soon!' }])
    }, 500)
  }

  return (
    <div className="ai-page">
      <div className="page-toolbar">
        <div><h2>AI Assistant</h2><p className="page-desc">Your personal study companion. Ask questions, get study tips, and more.</p></div>
      </div>

      <div className="ai-chat-container">
        <div className="ai-messages">
          {messages.length === 0 ? (
            <div className="ai-welcome">
              <div className="ai-welcome-icon">🤖</div>
              <h3>Hi! I'm your AI Study Assistant</h3>
              <p>Ask me anything about your studies, or try one of these suggestions:</p>
              <div className="ai-suggestions">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} className="ai-suggestion-chip" onClick={() => sendMessage(s)}>{s}</button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`ai-message ${msg.role}`}>
                <div className="ai-message-avatar">{msg.role === 'user' ? '🧑' : '🤖'}</div>
                <div className="ai-message-content">{msg.content}</div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="ai-input-bar">
          <input type="text" placeholder="Ask me anything..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} />
          <button className="btn btn-primary" onClick={() => sendMessage()} disabled={!input.trim()}>Send</button>
        </div>
      </div>
    </div>
  )
}
