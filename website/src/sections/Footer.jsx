import './Footer.css'

const Social = ({ d }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={d} /></svg>
)

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand">
              <span className="brand-mark">C</span>
              Cheon
            </div>
            <p className="footer-tag">
              The smart study planner and revision app for students. Plan
              smarter, revise better, ace your exams.
            </p>
          </div>
          <div className="footer-col">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#revision">Smart Revision</a></li>
              <li><a href="#showcase">Showcase</a></li>
              <li><a href="#download">Download</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Support</h4>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="https://discord.cheon.app" target="_blank" rel="noreferrer">Discord</a></li>
              <li><a href="https://cheon.app/privacy_policy" target="_blank" rel="noreferrer">Privacy Policy</a></li>
              <li><a href="https://cheon.app/terms_and_conditions" target="_blank" rel="noreferrer">Terms</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              <li><a href="https://cheon.app" target="_blank" rel="noreferrer">Website</a></li>
              <li><a href="https://instagram.com/cheonapp" target="_blank" rel="noreferrer">Instagram</a></li>
              <li><a href="https://discord.cheon.app" target="_blank" rel="noreferrer">Community</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Cheon. All rights reserved.</span>
          <div className="socials">
            <a href="https://discord.cheon.app" target="_blank" rel="noreferrer" aria-label="Discord">
              <Social d="M20.32 4.37A19.79 19.79 0 0 0 16.56 3a.14.14 0 0 0-.15.07c-.07.13-.14.26-.2.39a18.27 18.27 0 0 0-5.05 0c-.06-.14-.13-.26-.2-.39a.14.14 0 0 0-.15-.07c-1.32.23-2.6.58-3.76 1.37a.13.13 0 0 0-.06.05C2.7 8.16 1.99 11.85 2.34 15.5a.14.14 0 0 0 .05.09 19.9 19.9 0 0 0 5.99 3.03.14.14 0 0 0 .15-.05c.46-.63.87-1.29 1.23-1.99a.14.14 0 0 0-.07-.19c-.65-.25-1.27-.55-1.87-.89a.14.14 0 0 1-.01-.23l.37-.29a.13.13 0 0 1 .14-.01 14.23 14.23 0 0 0 12.1 0 .13.13 0 0 1 .14.01l.37.29a.14.14 0 0 1-.01.23c-.6.35-1.22.64-1.87.89a.14.14 0 0 0-.07.19c.37.7.78 1.36 1.23 1.99a.14.14 0 0 0 .15.05 19.86 19.86 0 0 0 5.99-3.03.14.14 0 0 0 .05-.09c.41-4.22-.69-7.88-2.92-11.08a.13.13 0 0 0-.06-.05zM9.02 13.3c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.41 2.15-2.41 1.21 0 2.17 1.09 2.15 2.41 0 1.33-.95 2.41-2.15 2.41zm5.97 0c-1.18 0-2.15-1.08-2.15-2.41 0-1.33.95-2.41 2.15-2.41 1.21 0 2.17 1.09 2.15 2.41 0 1.33-.94 2.41-2.15 2.41z" />
            </a>
            <a href="https://instagram.com/cheonapp" target="_blank" rel="noreferrer" aria-label="Instagram">
              <Social d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.27-.06 1.65-.07 4.85-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38A5.88 5.88 0 0 0 .63 4.14c-.3.76-.5 1.64-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.88 5.88 0 0 0 2.12-1.38 5.88 5.88 0 0 0 1.38-2.12c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.88 5.88 0 0 0-1.38-2.12A5.88 5.88 0 0 0 19.86.63c-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8zm6.41-10.4a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
