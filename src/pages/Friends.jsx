import './StubPages.css';

const FEATURES = [
  { icon: '👥', title: 'Add Friends', desc: 'Connect with classmates and study buddies' },
  { icon: '🏆', title: 'Leaderboards', desc: 'Compete with friends on weekly XP' },
  { icon: '🎯', title: 'Group Sessions', desc: 'Study together in shared focus rooms' },
  { icon: '📄', title: 'Share Notes', desc: 'Exchange notes and flashcards with friends' },
];

export default function Friends() {
  return (
    <div className="stub-page">
      <div className="stub-hero">👥</div>
      <h2>Friends</h2>
      <p className="stub-subtitle">Coming soon — social features to study together</p>
      <div className="stub-features">
        {FEATURES.map(f => (
          <div className="stub-feature-card card" key={f.title}>
            <div className="stub-feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
