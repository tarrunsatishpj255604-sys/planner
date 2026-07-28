import { useState, useRef, useEffect } from 'react';
import './StubPages.css';

const SUGGESTIONS = [
  'Summarize my notes',
  'Create a study plan',
  'Explain a concept',
  'Generate flashcards',
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hi! I’m your AI study assistant. Full features are coming soon, but feel free to say hi!' },
  ]);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = (text) => {
    if (!text.trim()) return;
    setMessages(m => [...m, { role: 'user', text }]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, { role: 'assistant', text: 'Thanks for your message! Full AI features are coming soon. 🚧' }]);
    }, 400);
  };

  return (
    <div className="ai-page">
      <div className="page-toolbar"><div><h2>AI Assistant</h2><p className="page-desc">Your personal study helper — coming soon</p></div></div>
      <div className="ai-chat">
        <div className="ai-messages">
          {messages.map((m, i) => (
            <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>
          ))}
          <div ref={endRef} />
        </div>
        <div className="ai-suggestions">
          {SUGGESTIONS.map(s => (
            <button key={s} className="ai-suggestion-chip" onClick={() => send(s)}>{s}</button>
          ))}
        </div>
        <div className="ai-input-row">
          <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send(input)} placeholder="Type a message..." />
          <button className="btn btn-primary" onClick={() => send(input)}>Send</button>
        </div>
      </div>
    </div>
  );
}
