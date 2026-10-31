import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import { projects, type Project } from '../content'
import { setSmoothScrollPaused } from '../hooks'
import { closeProject, openProject, projectHref, useOpenProject } from '../route'
import Arrow from './Arrow'

/** Plain clicks are handled in place; a modified click keeps the browser's own behaviour. */
const plain = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/** Order of entrance inside the page, 60ms apart. */
const step = (i: number) => ({ '--i': i }) as CSSProperties

/**
 * One page per project, laid over the site when its card is opened. Every page is in the markup from the start,
 * so it reads without script (CSS `:target` opens it) and the card's picture can morph into it.
 */
export default function ProjectPages() {
  const open = useOpenProject()
  const last = useRef('')

  useEffect(() => {
    const root = document.documentElement
    const behind = document.querySelectorAll<HTMLElement>('.skip-link, .site-header, #main')
    if (!open) {
      root.classList.remove('case-open')
      setSmoothScrollPaused(false)
      behind.forEach((el) => (el.inert = false))
      // Back on the card the visitor opened, so keyboard reading continues where it left off.
      if (last.current) document.querySelector<HTMLElement>(`[data-card-link="${last.current}"]`)?.focus({ preventScroll: false })
      last.current = ''
      return
    }
    last.current = open
    root.classList.add('case-open')
    setSmoothScrollPaused(true)
    behind.forEach((el) => (el.inert = true))
    const page = document.querySelector<HTMLElement>(`.case[data-slug="${open}"]`)
    if (page) page.scrollTop = 0
    page?.querySelector<HTMLElement>('.case-title')?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeProject(open)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      {projects.map((project, index) => (
        <ProjectPage
          key={project.slug}
          project={project}
          open={open === project.slug}
          next={projects.length > 1 ? projects[(index + 1) % projects.length] : undefined}
        />
      ))}
    </>
  )
}

function ProjectPage({ project, open, next }: { project: Project; open: boolean; next?: Project }) {
  const titleId = `case-${project.slug}-title`
  const onBack = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!plain(event)) return
    event.preventDefault()
    closeProject(project.slug)
  }
  return (
    <article
      className="case"
      id={`work-${project.slug}`}
      data-slug={project.slug}
      data-open={open || undefined}
      role="dialog"
      aria-modal={open || undefined}
      aria-labelledby={titleId}
      data-lenis-prevent
    >
      <div className="case-bar">
        <a className="case-back" href="#projects" onClick={onBack}>
          <Arrow back />
          <span>All work</span>
        </a>
        <a className="case-bar-link" href={project.repo}>
          Code on GitHub
        </a>
      </div>

      <div className="case-body">
        <header className="case-head">
          <h2 id={titleId} className="case-title case-in" style={step(0)} tabIndex={-1}>
            {project.name}
          </h2>
          <dl className="case-facts case-in" style={step(1)}>
            <div>
              <dt className="small">Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt className="small">Platform</dt>
              <dd>{project.platform}</dd>
            </div>
            <div>
              <dt className="small">Kind</dt>
              <dd>{project.kind}</dd>
            </div>
          </dl>
          <p className="lead case-summary case-in" style={step(2)}>
            {project.summary}
          </p>
        </header>

        <figure className="case-figure">
          <div className="case-media">
            {project.shots.map((shot) => (
              <img key={shot.src} src={shot.src} alt={shot.alt} width={540} height={1145} />
            ))}
          </div>
          <figcaption className="small case-in" style={step(3)}>
            {project.shotsCaption}
          </figcaption>
        </figure>

        <dl className="case-details">
          <div className="case-row case-in" style={step(4)}>
            <dt className="case-label">What it does</dt>
            <dd className="body">{project.does}</dd>
          </div>
          <div className="case-row case-in" style={step(5)}>
            <dt className="case-label">What I learned</dt>
            <dd>
              <ul className="case-learned">
                {project.learned.map((item) => (
                  <li className="body" key={item}>
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </div>
          <div className="case-row case-in" style={step(6)}>
            <dt className="case-label">Built with</dt>
            <dd>
              <ul className="case-stack body">
                {project.stack.split(', ').map((tool) => (
                  <li key={tool}>{tool}</li>
                ))}
              </ul>
            </dd>
          </div>
        </dl>

        <footer className="case-foot">
          <a className="contact-link" href={project.repo} aria-label={`${project.name} code on GitHub`}>
            Code on GitHub
          </a>
          {next ? (
            <a
              className="case-next"
              href={projectHref(next.slug)}
              onClick={(event) => {
                if (!plain(event)) return
                event.preventDefault()
                openProject(next.slug)
              }}
            >
              <span className="small">Next project</span>
              <span className="case-next-name">{next.name}</span>
            </a>
          ) : (
            <a className="case-back case-back-foot" href="#projects" onClick={onBack}>
              <Arrow back />
              <span>Back to all work</span>
            </a>
          )}
        </footer>
      </div>
    </article>
  )
}
