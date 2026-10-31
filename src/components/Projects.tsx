import type { MouseEvent } from 'react'
import { projects } from '../content'
import { openProject, projectHref } from '../route'
import Arrow from './Arrow'

/** Opens the project page in place; a modified click (new tab, new window) keeps the plain link. */
function onOpen(event: MouseEvent<HTMLAnchorElement>, slug: string) {
  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
  event.preventDefault()
  openProject(slug)
}

export default function Projects() {
  return (
    <section className="projects" id="projects" data-tone="raised" aria-labelledby="projects-title">
      <div className="section-head projects-head">
        <h2 id="projects-title" className="reveal" data-reveal>
          What I’ve built
        </h2>
        <p className="body reveal" data-reveal>
          Open a project to see what it does, what I learned building it, and the code.
        </p>
      </div>
      <ul className="work-grid" data-count={projects.length}>
        {projects.map((project) => (
          <li className="work-card" key={project.slug}>
            <div className="work-card-media reveal" data-reveal data-card-media={project.slug}>
              {project.shots.map((shot) => (
                <img key={shot.src} src={shot.src} alt="" width={540} height={1145} loading="lazy" decoding="async" />
              ))}
            </div>
            <div className="work-card-text">
              <h3 className="work-card-name reveal" data-reveal>
                {/* The link covers the whole card; its name is the project's, so a list of links reads cleanly. */}
                <a
                  className="work-card-link"
                  href={projectHref(project.slug)}
                  data-card-link={project.slug}
                  onClick={(event) => onOpen(event, project.slug)}
                >
                  {project.name}
                </a>
              </h3>
              <p className="small reveal" data-reveal>
                {project.meta}
              </p>
              <p className="body work-card-blurb reveal" data-reveal>
                {project.blurb}
              </p>
              <p className="work-card-more reveal" data-reveal aria-hidden="true">
                <span>See how I built it</span>
                <Arrow />
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
