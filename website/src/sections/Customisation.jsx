import './Customisation.css'

const Ic = ({ d }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const items = [
  { d: 'M7 21a4 4 0 0 1-4-4V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a4 4 0 0 1-4 4zm0 0h12a2 2 0 0 0 2-2v-4a2 2 0 0 0-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 0 1 2.828 0l2.829 2.829a2 2 0 0 1 0 2.828l-7.072 7.072', label: 'Accent colour', desc: 'Pick any colour for buttons and highlights' },
  { d: 'M4 16l4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2l1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z', label: 'Background', desc: 'Solid, gradient or custom wallpaper' },
  { d: 'M4 7V4h16v3M9 20h6M12 4v16', label: 'Fonts', desc: 'Choose from multiple font families' },
  { d: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.5 5.5L21 12l-5.5 2.5L13 20l-2.5-5.5L5 12l5.5-2.5L13 4z', label: 'Card radius', desc: 'From sharp corners to fully rounded' },
  { d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3', label: 'Glassmorphism', desc: 'Adjust blur and transparency strength' },
  { d: 'M13 10V3L4 14h7v7l9-11h-7z', label: 'Animations', desc: 'Enable or reduce motion effects' },
  { d: 'M4 6h16M4 12h16M4 18h7', label: 'Dashboard layout', desc: 'Drag widgets where you want them' },
  { d: 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', label: 'Widget visibility', desc: 'Show or hide any dashboard widget' },
  { d: 'M5 8h14M5 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zM5 16h14M5 16a2 2 0 1 1 0-4 2 2 0 0 1 0 4z', label: 'Sidebar position', desc: 'Left or right — your choice' },
  { d: 'M20 13V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h7M7 9h2v2H7zM7 13h2v2H7zM11 9h2v2h-2zM11 13h2v2h-2z', label: 'Density', desc: 'Compact or comfortable spacing' },
]

export default function Customisation() {
  return (
    <section className="section" id="customise">
      <div className="container">
        <span className="eyebrow">Total control</span>
        <h2 className="section-title">Customise everything</h2>
        <p className="section-sub">
          Fine-tune every detail until your planner feels uniquely yours. No
          two dashboards need to look the same.
        </p>

        <div className="customise">
          <div className="customise-points">
            {items.map((it) => (
              <div key={it.label} className="cust-item">
                <span className="ic"><Ic d={it.d} /></span>
                <div>
                  <div className="label">{it.label}</div>
                  <div className="desc">{it.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="settings-mock" aria-hidden="true">
            <div className="settings-head"><span className="dot" /> Appearance</div>
            <div className="settings-body">
              <div className="setting-row">
                <div>
                  <div className="slabel">Accent colour</div>
                  <div className="ssub">Used across buttons and highlights</div>
                </div>
                <div className="swatch-row">
                  <span style={{ background: '#4caf50' }} />
                  <span style={{ background: '#2bbd7e' }} />
                  <span style={{ background: '#fb8c00' }} />
                  <span style={{ background: '#e53935' }} />
                  <span style={{ background: '#7c3aed' }} />
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <div className="slabel">Glassmorphism</div>
                  <div className="ssub">Blur and transparency effects</div>
                </div>
                <div className="toggle on" />
              </div>
              <div className="setting-row">
                <div>
                  <div className="slabel">Animations</div>
                  <div className="ssub">Motion and transitions</div>
                </div>
                <div className="toggle on" />
              </div>
              <div className="setting-row">
                <div>
                  <div className="slabel">Card radius</div>
                  <div className="ssub">Corner roundness</div>
                </div>
                <div className="slider-mock">
                  <div className="track"><div className="knob" /></div>
                  <span className="val">14px</span>
                </div>
              </div>
              <div className="setting-row">
                <div>
                  <div className="slabel">Density</div>
                  <div className="ssub">Spacing between elements</div>
                </div>
                <div className="seg">
                  <button>Compact</button>
                  <button className="active">Comfortable</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
