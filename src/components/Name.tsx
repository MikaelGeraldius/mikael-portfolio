import { person } from '../content'

interface Props {
  /** The opening uses the page's h1; the closing repeat is decorative. */
  as: 'h1' | 'p'
  id?: string
}

/** The name on two lines, never wrapped. Plain type: no tiles or blocks behind it. */
export default function Name({ as: Tag, id }: Props) {
  return (
    <Tag id={id} className="name" aria-hidden={Tag === 'p' ? true : undefined}>
      <span className="name-line">
        <span className="name-line-inner">{person.firstLine}</span>
      </span>{' '}
      <span className="name-line">
        <span className="name-line-inner">{person.secondLine}</span>
      </span>
    </Tag>
  )
}
