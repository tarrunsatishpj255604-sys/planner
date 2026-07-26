import { useState, useEffect } from 'react'
import './App.css'

import Nav from './components/Nav.jsx'
import Hero from './sections/Hero.jsx'
import Features from './sections/Features.jsx'
import SmartRevision from './sections/SmartRevision.jsx'
import Showcase from './sections/Showcase.jsx'
import Timeline from './sections/Timeline.jsx'
import CTA from './sections/CTA.jsx'
import FAQ from './sections/FAQ.jsx'
import Footer from './sections/Footer.jsx'

export default function App() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Nav scrolled={scrolled} />
      <main>
        <Hero />
        <Features />
        <SmartRevision />
        <Showcase />
        <Timeline />
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </>
  )
}
