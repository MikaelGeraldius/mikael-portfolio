import { person } from '../content'
import { useChapter } from '../hooks'

const links = [
  // Hidden on narrow phones so five links and the wordmark fit one line; the
  // chapter sits directly under the opening screen.
  { href: '#education', label: 'Education', optional: true },
  { href: '#focus', label: 'Focus' },
  { href: '#projects', label: 'Work' },
  { href: '#studied', label: 'Studied' },
  { href: '#contact', label: 'Contact' },
]

export default function Header() {
  const { tone, id } = useChapter()
  return (
    <header className="site-header" data-header-tone={tone}>
      <a className="wordmark" href="#top" aria-label={`${person.name}, back to top`}>
        {person.wordmark}
      </a>
      <nav aria-label="Sections">
        <ul>
          {links.map((link) => (
            <li key={link.href} className={link.optional ? 'nav-optional' : undefined}>
              <a href={link.href} aria-current={link.href === `#${id}` ? 'location' : undefined}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
