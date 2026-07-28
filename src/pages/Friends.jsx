import './StubPages.css'

const FEATURES = [
  { icon: '👥', title: 'Study Groups', desc: 'Create and join study groups with classmates to share notes, tasks, and progress.' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends on weekly study hours, streaks, and XP earned.' },
  { icon: '💬', title: 'Chat & Share', desc: 'Message friends, share flashcard decks, and collaborate on notes in real time.' },
  { icon: '🎁', title: 'Send Rewards', desc: 'Gift XP boosts, study challenges, and motivational stickers to keep friends going.' },
  { icon: '📅', title: 'Shared Calendar', desc: 'Plan group study sessions and sync exam dates with your study buddies.' },
  { icon: '📊', title: 'Compare Stats', desc: 'See how your study habits stack up against your friends with side-by-side analytics.' },
]

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="stub-hero">
        <div className="stub-hero-icon">👥</div>
        <h1>Friends &amp; Study Groups</h1>
        <p className="stub-tagline">Study better, together. Connect with classmates, share progress, and stay motivated.</p>
        <span className="stub-badge">Coming Soon</span>
      </div>

      <div className="grid-3 stub-features">
        {FEATURES.map((f, i) => (
          <div key={i} className="stub-feature-card">
            <div className="stub-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>

      <div className="stub-notify">
        <p>Want early access when this launches?</p>
        <button className="btn btn-primary">Notify Me</button>
      </div>
    </div>
  )
}
