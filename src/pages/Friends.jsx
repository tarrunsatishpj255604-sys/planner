import './StubPages.css'

export default function Friends() {
  const features = [
    { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and study buddies' },
    { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends on study streaks and XP' },
    { icon: '📚', title: 'Group Sessions', desc: 'Study together with shared focus sessions' },
    { icon: '📝', title: 'Share Notes', desc: 'Exchange notes and flashcards with friends' },
    { icon: '📊', title: 'Compare Stats', desc: 'See how your progress stacks up' },
  ]
  return (
    <div className="stub-page">
      <div className="stub-hero"><span className="stub-icon-big">👥</span><h2>Friends</h2><p>Coming soon — connect and study together</p></div>
      <div className="stub-features">{features.map((f, i) => <div key={i} className="stub-feature-card"><span className="stub-feature-icon">{f.icon}</span><h3>{f.title}</h3><p>{f.desc}</p></div>)}</div>
    </div>
  )
}
