import './StubPages.css'

const FEATURES = [
  { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and build your study network.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends and climb the weekly study rankings.' },
  { icon: '🎯', title: 'Group Study Sessions', desc: 'Create and join group focus sessions with shared timers.' },
  { icon: '📤', title: 'Share Notes', desc: 'Share your notes and flashcards with friends easily.' },
  { icon: '📊', title: 'Compare Stats', desc: 'See how your study habits compare to your friends.' },
]

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="page-toolbar">
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Friends</h2>
          <p className="page-desc">Social features to study together and stay motivated.</p>
        </div>
      </div>

      <div className="stub-hero">
        <span className="stub-hero-icon">👥</span>
        <h2>Coming Soon</h2>
        <p>We're building powerful social features to help you study with friends. Here's what's coming:</p>
      </div>

      <div className="stub-features">
        {FEATURES.map((f, i) => (
          <div key={i} className="card stub-feature-card">
            <span className="stub-feature-icon">{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
