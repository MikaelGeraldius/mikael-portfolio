import { projects } from '../content'

export default function Projects() {
  return (
    <section className="projects" id="projects" data-tone="raised" aria-labelledby="projects-title">
      <h2 id="projects-title" className="reveal" data-reveal>
        What I’ve built
      </h2>
      {projects.map((project) => (
        <article className="project" key={project.name} aria-labelledby={`project-${project.name}`}>
          <div className="project-head">
            <h3 id={`project-${project.name}`} className="project-name reveal" data-reveal>
              {project.name}
            </h3>
            <p className="small reveal" data-reveal>
              {project.meta}
            </p>
          </div>
          <p className="lead project-summary reveal" data-reveal>
            {project.summary}
          </p>
          <dl className="project-details">
            <div className="studied-row reveal" data-reveal>
              <dt className="project-label">What it does</dt>
              <dd className="body studied-topics">{project.does}</dd>
            </div>
            <div className="studied-row reveal" data-reveal>
              <dt className="project-label">What I learned</dt>
              <dd className="studied-topics">
                <ul className="project-learned">
                  {project.learned.map((item) => (
                    <li className="body" key={item}>
                      {item}
                    </li>
                  ))}
                </ul>
              </dd>
            </div>
            <div className="studied-row reveal" data-reveal>
              <dt className="project-label">Built with</dt>
              <dd className="body studied-topics">{project.stack}</dd>
            </div>
          </dl>
          <p className="project-link reveal" data-reveal>
            <a className="contact-link" href={project.repo} aria-label={`${project.name} code on GitHub`}>
              Code on GitHub
            </a>
          </p>
        </article>
      ))}
    </section>
  )
}
