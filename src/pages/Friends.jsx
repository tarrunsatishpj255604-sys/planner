import './StubPages.css'

export default function Friends() {
  const features = [
    { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and study buddies' },
    { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends and climb the ranks' },
    { icon: '📚', title: 'Group Sessions', desc: 'Study together in shared focus rooms' },
    { icon: '📝', title: 'Share Notes', desc: 'Exchange notes and flashcards with friends' },
  ]
  return (
    <div className="stub-page">
      <div className="stub-hero">
        <div className="stub-emoji">👥</div>
        <h2>Friends</h2>
        <p className="stub-tagline">Coming soon</p>
        <p className="stub-desc">We're building social features to help you study with friends and stay motivated together.</p>
      </div>
      <div className="grid-2 stub-features">
        {features.map(f => (
          <div key={f.title} className="card stub-feature">
            <span className="stub-feature-icon">{f.icon}</span>
            <div><h3>{f.title}</h3><p>{f.desc}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}
