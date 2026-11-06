import { renderToString } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import App from './App'

// Server rendering shows what a visitor gets before any script or WebGL runs.
describe('page markup', () => {
  // React marks adjacent text nodes with comments; drop them so text reads as a visitor sees it.
  const html = renderToString(<App />).replace(/<!-- -->/g, '')

  it('has one h1 with the full name and a skip link', () => {
    expect(html.match(/<h1/g)).toHaveLength(1)
    expect(html).toContain('Mikael Geraldius')
    expect(html).toContain('Gunawan')
    expect(html).toContain('href="#main"')
  })

  it('names every section with a heading', () => {
    for (const title of ['Studying Informatics', 'AI and web design', 'What I’ve built', 'What I’ve studied', 'Get in touch']) {
      expect(html).toContain(title)
    }
  })

  it('speaks in the first person throughout', () => {
    expect(html).toContain('I’m an Informatics student')
    expect(html).not.toMatch(/Mikael (has|is|wants|uses)|\b(he|him|his)\b/)
  })

  it('renders the accessible topic list and radio group without the 3D canvas', () => {
    expect(html).not.toContain('<canvas')
    expect(html.match(/type="radio"/g)).toHaveLength(4)
    expect(html).toContain('Machine learning')
    expect(html).toContain('aria-live="polite"')
  })

  it('links each work card to its own project page, present in the markup so it reads without script', () => {
    expect(html).toContain('href="#work-regionmusic"')
    expect(html).toContain('id="work-regionmusic"')
    expect(html).toContain('What I learned')
    expect(html).toContain('href="#projects"')
  })

  it('offers the CV as a download from the header', () => {
    expect(html).toMatch(/<a class="button header-resume" href="[^"]*Mikael_Geraldius_Gunawan_CV\.pdf" download="Mikael_Geraldius_Gunawan_CV\.pdf"/)
  })

  it('folds the section links into a menu that opens without script', () => {
    expect(html).toMatch(/<button[^>]*popoverTarget="site-menu"/i)
    expect(html).toMatch(/id="site-menu" popover="auto"/)
    const menu = html.slice(html.indexOf('id="site-menu"'))
    for (const href of ['#education', '#focus', '#projects', '#studied', '#contact']) {
      expect(menu).toContain(`href="${href}"`)
    }
  })

  it('has real contact links and only the confirmed project', () => {
    expect(html).toContain('mailto:ops.gege.lie@gmail.com')
    expect(html).toContain('RegionMusic')
    expect(html).toContain('href="https://github.com/MikaelGeraldius/RegionMusic"')
    expect(html).not.toContain('tel:')
    expect(html).not.toMatch(/case study|lorem\s+ipsum/i)
  })
})
