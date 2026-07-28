import './StubPages.css'

const FEATURES = [
  { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and study buddies.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends and climb the ranks.' },
  { icon: '📚', title: 'Group Study Sessions', desc: 'Study together in real-time focus rooms.' },
  { icon: '📝', title: 'Share Notes', desc: 'Exchange notes and flashcards with friends.' },
  { icon: '📊', title: 'Compare Stats', desc: 'See how your progress stacks up.' },
]

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="stub-hero">
        <div className="stub-hero-icon">👥</div>
        <h1>Coming Soon</h1>
        <p className="stub-subtitle">Social features are on the way. Here's what you'll be able to do:</p>
      </div>
      <div className="stub-feature-grid">
        {FEATURES.map((f, i) => (
          <div key={i} className="card stub-feature-card">
            <div className="stub-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
