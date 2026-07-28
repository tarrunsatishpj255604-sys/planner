import { useState } from 'react'
import { useApp } from '../lib/AppContext.jsx'
import './StubPages.css'

const SUGGESTIONS = [
  'Explain a topic',
  'Summarize my notes',
  'Generate a quiz',
  'Create flashcards',
  'Make a study plan',
  'Solve a doubt',
  'Predict exam topics',
  'Help with homework',
]

export default function AIAssistant() {
  const { subjects } = useApp()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([])

  const send = () => {
    if (!input.trim()) return
    setMessages([...messages, { role: 'user', text: input }])
    setMessages(prev => [...prev, { role: 'ai', text: 'This feature is coming soon! Once enabled, I\'ll be able to help you with study plans, quizzes, flashcards, and more.' }])
    setInput('')
  }

  return (
    <div className="ai-page">
      <div className="ai-header">
        <div className="stub-icon" style={{ fontSize: 32 }}>🤖</div>
        <h2>AI Study Assistant</h2>
        <p>Your personal AI tutor — explain topics, summarize notes, generate quizzes, and create study plans.</p>
      </div>

      <div className="ai-suggestions">
        {SUGGESTIONS.map(s => (
          <button key={s} className="ai-suggestion-chip" onClick={() => setInput(s)}>{s}</button>
        ))}
      </div>

      <div className="ai-chat">
        {messages.length === 0 ? (
          <div className="ai-empty">Ask me anything about your studies!</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>
              <span className="ai-msg-icon">{m.role === 'user' ? '🧑‍🎓' : '🤖'}</span>
              <span className="ai-msg-text">{m.text}</span>
            </div>
          ))
        )}
      </div>

      <div className="ai-input-row">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder="Ask your AI assistant…"
          className="ai-input"
        />
        <button className="btn btn-primary" onClick={send}>Send</button>
      </div>
      <div className="stub-coming-soon">AI features coming soon</div>
    </div>
  )
}
