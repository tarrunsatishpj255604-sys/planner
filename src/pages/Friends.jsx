import './StubPages.css'

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="stub-icon">👥</div>
      <h2>Friends & Study Groups</h2>
      <p>Add friends, compare streaks, climb the leaderboard, and study together in group sessions. Share notes and keep each other motivated.</p>
      <div className="stub-features">
        <div className="stub-feature"><span>🤝</span> Add & manage friends</div>
        <div className="stub-feature"><span>🏆</span> Streak leaderboards</div>
        <div className="stub-feature"><span>📚</span> Group study sessions</div>
        <div className="stub-feature"><span>📤</span> Share notes</div>
      </div>
      <div className="stub-coming-soon">Coming soon</div>
    </div>
  )
}
