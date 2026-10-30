import { Fragment } from 'react'
import { heroParts, mailtoHref } from '../content'
import Name from './Name'

export default function Hero() {
  return (
    <section className="hero" id="top" data-tone="ground" aria-labelledby="name">
      <Name as="h1" id="name" />
      <div className="hero-foot">
        <p className="lead hero-sentence">
          {heroParts.map((part, index) => (
            <Fragment key={part.text}>
              {index > 0 ? ' ' : null}
              {part.mark ? <span className="mark">{part.text}</span> : part.text}
            </Fragment>
          ))}
        </p>
        <a className="button" href={mailtoHref}>
          Email me
        </a>
      </div>
    </section>
  )
}
