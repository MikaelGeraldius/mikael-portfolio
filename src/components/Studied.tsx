import { studied } from '../content'

export default function Studied() {
  return (
    <section className="studied" id="studied" data-tone="ground" aria-labelledby="studied-title">
      <h2 id="studied-title" className="reveal" data-reveal>
        What I’ve studied
      </h2>
      <ul className="studied-list">
        {studied.map((item) => (
          <li className="studied-row reveal" data-reveal key={item.area}>
            <h3 className="studied-area">{item.area}</h3>
            <p className="body studied-topics">{item.topics}</p>
          </li>
        ))}
      </ul>
      <p className="small studied-note reveal" data-reveal>
        Everything here comes from my studies so far. Projects are not on this page yet.
      </p>
    </section>
  )
}
