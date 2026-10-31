import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import { projects, type Project } from '../content'
import { setSmoothScrollPaused } from '../hooks'
import { closeProject, openProject, projectHref, useOpenProject } from '../route'
import Arrow from './Arrow'

/** Plain clicks are handled in place; a modified click keeps the browser's own behaviour. */
const plain = (event: MouseEvent) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey

/** A lesson reads "The lesson: what happened". The part before the colon becomes its title. */
function splitLesson(item: string): [string, string] {
  const at = item.indexOf(': ')
  if (at < 1 || at > 90) return ['', item]
  const detail = item.slice(at + 2)
  return [item.slice(0, at), detail.charAt(0).toUpperCase() + detail.slice(1)]
}

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
        <div className="case-bar-links">
          {project.site ? (
            <a className="case-bar-link" href={project.site}>
              Try it live
            </a>
          ) : null}
          <a className="case-bar-link" href={project.repo}>
            Code on GitHub
          </a>
        </div>
      </div>

      <div className="case-body">
        <header className="case-head">
          <h2 id={titleId} className="case-title case-in" style={step(0)} tabIndex={-1}>
            {project.name}
          </h2>
          <div className="case-summary case-in" style={step(1)}>
            <p className="lead">{project.summary}</p>
            {project.credit ? <p className="body case-credit">{project.credit}</p> : null}
          </div>
          <dl className="case-facts case-in" style={step(2)}>
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
        </header>

        <figure className="case-figure">
          <div className="case-media" data-frame={project.frame}>
            {project.shots.map((shot) => (
              <img key={shot.src} src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} />
            ))}
          </div>
          <figcaption className="small case-in" style={step(3)}>
            {project.shotsCaption}
          </figcaption>
        </figure>

        {/* What it does and what it is built with share a row, so neither sits beside an empty column. */}
        <div className="case-overview">
          <section className="case-block case-does case-in" style={step(4)} aria-labelledby={`${titleId}-does`}>
            <h3 id={`${titleId}-does`} className="case-label">
              What it does
            </h3>
            <p className="body">{project.does}</p>
          </section>
          <section className="case-block case-built case-in" style={step(5)} aria-labelledby={`${titleId}-built`}>
            <h3 id={`${titleId}-built`} className="case-label">
              Built with
            </h3>
            <ul className="case-stack body">
              {project.stack.split(', ').map((tool) => (
                <li key={tool}>{tool}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="case-block case-lessons" aria-labelledby={`${titleId}-learned`}>
          <h3 id={`${titleId}-learned`} className="case-label case-in" style={step(6)}>
            What I learned
          </h3>
          <ul className="case-learned">
            {project.learned.map((item, i) => {
              const [lesson, detail] = splitLesson(item)
              return (
                <li className="case-in" style={step(7 + Math.min(i, 5))} key={item}>
                  {lesson ? <strong className="case-lesson">{lesson}</strong> : null}
                  <p className="body">{detail}</p>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className="case-foot">
          <div className="case-foot-links">
            {project.site ? (
              <a className="contact-link" href={project.site} aria-label={`Try ${project.name} live`}>
                Try it live
              </a>
            ) : null}
            <a className="contact-link" href={project.repo} aria-label={`${project.name} code on GitHub`}>
              Code on GitHub
            </a>
          </div>
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
