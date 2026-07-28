import './StubPages.css'

const FEATURES = [
  { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and study buddies.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends on weekly study streaks.' },
  { icon: '🎯', title: 'Group Sessions', desc: 'Study together with synchronized focus timers.' },
  { icon: '📤', title: 'Share Notes', desc: 'Share your best notes and flashcards with friends.' },
]

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="stub-hero">
        <div className="stub-hero-icon">👥</div>
        <h1>Friends</h1>
        <p className="stub-tagline">Study better together — coming soon!</p>
        <div className="stub-badge">Coming Soon</div>
      </div>
      <div className="stub-features">
        {FEATURES.map((f, i) => (
          <div key={i} className="stub-feature">
            <div className="stub-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
