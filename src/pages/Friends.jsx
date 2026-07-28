import './StubPages.css'

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="page-toolbar">
        <div><h2>Friends</h2><p className="page-desc">Connect and study with your peers.</p></div>
      </div>
      <div className="stub-card">
        <div className="stub-icon">👥</div>
        <h3>Coming Soon</h3>
        <p>We're building social features to help you study together.</p>
        <div className="stub-features">
          <div className="stub-feature"><span className="sf-icon">🤝</span><div><strong>Add Friends</strong><p>Connect with classmates and study buddies.</p></div></div>
          <div className="stub-feature"><span className="sf-icon">🏆</span><div><strong>Leaderboards</strong><p>Compete with friends on XP and streaks.</p></div></div>
          <div className="stub-feature"><span className="sf-icon">📚</span><div><strong>Group Sessions</strong><p>Join shared focus sessions and study rooms.</p></div></div>
          <div className="stub-feature"><span className="sf-icon">📤</span><div><strong>Share Notes</strong><p>Exchange notes and flashcards with friends.</p></div></div>
        </div>
      </div>
    </div>
  )
}
