import { facts, person } from '../content'

export default function Education() {
  return (
    <section className="education" id="education" data-tone="raised" aria-labelledby="education-title">
      <div className="education-grid">
        <div className="section-head">
          <h2 id="education-title" className="reveal" data-reveal>
            Studying {person.degree}
          </h2>
          <p className="lead reveal" data-reveal>
            At {person.university} I’ve studied frontend, backend, mobile, machine learning and game development.
          </p>
        </div>
        <dl className="facts">
          {facts.map((fact) => (
            <div className="fact reveal" data-reveal key={fact.label}>
              <dt>{fact.value}</dt>
              <dd className="small">{fact.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
