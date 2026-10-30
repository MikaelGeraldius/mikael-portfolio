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
    for (const title of ['Studying Informatics', 'AI and web design', 'What I’ve studied', 'Get in touch']) {
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

  it('has real contact links and no project cards', () => {
    expect(html).toContain('mailto:ops.gege.lie@gmail.com')
    expect(html).not.toContain('tel:')
    expect(html).not.toMatch(/case study|lorem\s+ipsum/i)
  })
})
