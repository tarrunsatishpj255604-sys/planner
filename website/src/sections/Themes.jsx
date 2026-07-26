import './Themes.css'

const themes = [
  { cls: 't-midnight', name: 'Midnight', desc: 'Dark navy with blue accents' },
  { cls: 't-galaxy', name: 'Purple Galaxy', desc: 'Deep purple gradients' },
  { cls: 't-emerald', name: 'Emerald', desc: 'Minimal green productivity' },
  { cls: 't-sakura', name: 'Sakura', desc: 'Soft pink with clean cards' },
  { cls: 't-ocean', name: 'Ocean', desc: 'Blue and cyan gradients' },
  { cls: 't-lava', name: 'Lava', desc: 'Orange and red neon' },
  { cls: 't-obsidian', name: 'Obsidian', desc: 'Pure black OLED theme' },
  { cls: 't-paper', name: 'Paper', desc: 'Minimal light mode' },
  { cls: 't-aurora', name: 'Aurora', desc: 'Animated gradient colours' },
  { cls: 't-cyberpunk', name: 'Cyberpunk', desc: 'Neon cyan, magenta, yellow' },
]

export default function Themes() {
  return (
    <section className="section themes-section" id="themes">
      <div className="container">
        <span className="eyebrow">Make it yours</span>
        <h2 className="section-title">11 stunning themes</h2>
        <p className="section-sub">
          From midnight calm to cyberpunk neon — switch your entire look with a
          single tap. Every theme is carefully crafted for readability and focus.
        </p>
        <div className="themes-grid">
          {themes.map((t) => (
            <div key={t.name} className="theme-card">
              <div className={`theme-preview ${t.cls}`}>
                <div className="lines"><span /><span /><span /></div>
              </div>
              <div className="theme-meta">
                <h4>{t.name}</h4>
                <p>{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
