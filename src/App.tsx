import Contact from './components/Contact'
import Education from './components/Education'
import Focus from './components/Focus'
import Header from './components/Header'
import Hero from './components/Hero'
import ProjectPages from './components/ProjectPages'
import Projects from './components/Projects'
import Studied from './components/Studied'
import { useReducedMotion, useRevealOnScroll, useSmoothAnchors, useSmoothScroll } from './hooks'

export default function App() {
  const reduced = useReducedMotion()
  useRevealOnScroll()
  useSmoothScroll(reduced)
  useSmoothAnchors()
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Header />
      <main id="main">
        <Hero />
        <Education />
        <Focus />
        <Projects />
        <Studied />
        <Contact />
      </main>
      <ProjectPages />
    </>
  )
}
