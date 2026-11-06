import type { MouseEvent } from 'react'
import { cvFile, cvHref, person } from '../content'
import { useChapter } from '../hooks'

const links = [
  { href: '#education', label: 'Education' },
  { href: '#focus', label: 'Focus' },
  { href: '#projects', label: 'Work' },
  { href: '#studied', label: 'Studied' },
  { href: '#contact', label: 'Contact' },
]

/** Choosing a section closes the phone menu; the page's own click handler then scrolls to it. */
function closeMenuOnLink(event: MouseEvent<HTMLElement>) {
  if ((event.target as Element).closest('a')) event.currentTarget.hidePopover()
}

export default function Header() {
  const { tone, id } = useChapter()
  const list = (
    <ul>
      {links.map((link) => (
        <li key={link.href}>
          <a href={link.href} aria-current={link.href === `#${id}` ? 'location' : undefined}>
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
  return (
    <header className="site-header" data-header-tone={tone}>
      <a className="wordmark" href="#top" aria-label={`${person.name}, back to top`}>
        {person.wordmark}
      </a>
      <div className="header-end">
        <nav className="header-links" aria-label="Sections">
          {list}
        </nav>
        <a className="button header-resume" href={cvHref} download={cvFile} aria-label="Download my resume (PDF)">
          Resume
        </a>
        {/* Phones: a native popover, so it opens without script and closes with Escape or a tap outside. */}
        <button className="menu-toggle" type="button" popoverTarget="site-menu" aria-controls="site-menu" aria-label="Menu">
          <span />
          <span />
          <span />
        </button>
        <nav className="site-menu" id="site-menu" popover="auto" aria-label="Sections" onClick={closeMenuOnLink}>
          {list}
        </nav>
      </div>
    </header>
  )
}
