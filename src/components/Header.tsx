import { person } from '../content'
import { useChapter } from '../hooks'

const links = [
  { href: '#education', label: 'Education' },
  { href: '#focus', label: 'Focus' },
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
            <li key={link.href}>
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
