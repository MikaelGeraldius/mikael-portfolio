import { contact, mailtoHref, person } from '../content'

export default function Contact() {
  return (
    <>
      <section className="contact" id="contact" data-tone="raised" aria-labelledby="contact-title">
        <div className="section-head contact-head">
          <h2 id="contact-title" className="reveal" data-reveal>
            Get in touch
          </h2>
          <p className="lead reveal" data-reveal>
            I’m looking for an internship or a job in AI and web design. Email is the best way to reach me.
          </p>
        </div>
        <dl className="contact-methods">
          <div className="contact-method reveal" data-reveal>
            <dt className="small">Email</dt>
            <dd>
              <a className="contact-link" href={mailtoHref} aria-label={`Email ${contact.email}`}>
                {contact.email}
              </a>
            </dd>
          </div>
        </dl>
      </section>
      <footer className="site-footer" data-tone="raised">
        <p className="small">
          &copy; 2026 {person.wordmark}
        </p>
        <a href="#top">Back to top</a>
      </footer>
    </>
  )
}
