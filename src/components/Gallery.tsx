import { useCallback, useEffect, useRef, useState } from 'react'
import type { Project } from '../content'
import Arrow from './Arrow'

/** Fast start, long soft landing: the picture glides into place rather than stopping short. */
const glide = (t: number) => 1 - Math.pow(1 - t, 4)
const SLIDE_MS = 520
/** How long a picture stays before the gallery moves on by itself. */
const DWELL_MS = 5000

/**
 * A project's screenshots as one large picture with a strip of thumbnails beneath, like a store page's gallery.
 * The pictures sit in a horizontal track that snaps one to a view, so without script it still swipes and scrolls;
 * the arrows and thumbnails arrive with script. Mikael chose to have it glide for every visitor, and to move on by
 * itself every few seconds while nobody is pointing at it, focused on it or swiping it.
 */
export default function Gallery({ project, open }: { project: Project; open: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const thumbs = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [ready, setReady] = useState(false)
  const [held, setHeld] = useState({ hover: false, focus: false, touch: false })
  const [inView, setInView] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const count = project.shots.length
  // The slide in flight, so a new click or a swipe can take over from it.
  const flight = useRef<{ frame: number; done: () => void } | null>(null)

  const land = useCallback(() => {
    if (!flight.current) return
    cancelAnimationFrame(flight.current.frame)
    flight.current.done()
    flight.current = null
  }, [])

  useEffect(() => setReady(true), [])

  // Each time the page opens it starts on the first picture.
  useEffect(() => {
    if (!open || !track.current) return
    track.current.scrollLeft = 0
    setActive(0)
  }, [open])

  // The picture in view is whichever slide the track has scrolled to.
  useEffect(() => {
    const el = track.current
    if (!el) return
    let frame = 0
    const onScroll = () => {
      // While a slide is animating, the thumbnails already show where it is going.
      if (flight.current) return
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const i = Math.round(el.scrollLeft / Math.max(1, el.clientWidth))
        setActive(Math.min(count - 1, Math.max(0, i)))
      })
    }
    // A hand on the gallery takes over from the animation at once.
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('pointerdown', land)
    el.addEventListener('wheel', land, { passive: true })
    el.addEventListener('touchstart', land, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('pointerdown', land)
      el.removeEventListener('wheel', land)
      el.removeEventListener('touchstart', land)
      cancelAnimationFrame(frame)
      land()
    }
  }, [count, land])

  // Keep the chosen thumbnail in view when the strip is wider than the page.
  useEffect(() => {
    const strip = thumbs.current
    const thumb = strip?.children[active] as HTMLElement | undefined
    if (!strip || !thumb) return
    const left = thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2
    strip.scrollTo({ left, behavior: 'smooth' })
  }, [active])

  const go = useCallback(
    (i: number) => {
      const el = track.current
      if (!el) return
      const next = (i + count) % count
      setActive(next)
      land()
      const from = el.scrollLeft
      const to = next * el.clientWidth
      if (Math.abs(to - from) < 1) {
        el.scrollLeft = to
        return
      }
      // Snapping would fight the animation frame by frame, so it rests until the slide lands.
      el.style.scrollSnapType = 'none'
      const start = performance.now()
      const done = () => {
        el.style.scrollSnapType = ''
      }
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / SLIDE_MS)
        el.scrollLeft = from + (to - from) * glide(t)
        if (t < 1) flight.current = { frame: requestAnimationFrame(tick), done }
        else {
          flight.current = null
          done()
        }
      }
      flight.current = { frame: requestAnimationFrame(tick), done }
    },
    [count, land],
  )

  // Only while the gallery is on screen does it move by itself.
  useEffect(() => {
    const el = root.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.4 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Every change, by hand or by itself, restarts the wait, so it never moves on just after the visitor did.
  const paused = held.hover || held.focus || held.touch
  useEffect(() => {
    if (!open || !inView || paused || count < 2) return
    const id = window.setTimeout(() => {
      if (!document.hidden) go(active + 1)
    }, DWELL_MS)
    return () => window.clearTimeout(id)
  }, [open, inView, paused, active, count, go])

  const many = count > 1
  return (
    <div
      className="gallery"
      data-frame={project.frame}
      ref={root}
      onPointerEnter={(event) => event.pointerType === 'mouse' && setHeld((h) => ({ ...h, hover: true }))}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setHeld((h) => ({ ...h, hover: false }))}
      // Keyboard focus holds the gallery still; the focus a mouse click leaves behind does not.
      onFocus={(event) => (event.target as HTMLElement).matches(':focus-visible') && setHeld((h) => ({ ...h, focus: true }))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setHeld((h) => ({ ...h, focus: false }))
      }}
      onTouchStart={() => setHeld((h) => ({ ...h, touch: true }))}
      onTouchEnd={() => setHeld((h) => ({ ...h, touch: false }))}
      onTouchCancel={() => setHeld((h) => ({ ...h, touch: false }))}
    >
      <div className="gallery-stage">
        <div
          ref={track}
          className="case-media gallery-track"
          data-frame={project.frame}
          tabIndex={0}
          role="group"
          aria-roledescription="gallery"
          aria-label={`${project.name} screenshots`}
          onKeyDown={(event) => {
            if (event.key === 'ArrowRight') {
              event.preventDefault()
              go(active + 1)
            } else if (event.key === 'ArrowLeft') {
              event.preventDefault()
              go(active - 1)
            }
          }}
        >
          {project.shots.map((shot, i) => (
            <div
              className="gallery-slide"
              key={shot.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <img src={shot.src} alt={shot.alt} width={shot.width} height={shot.height} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" />
            </div>
          ))}
        </div>
        {ready && many ? (
          <>
            <button type="button" className="gallery-arrow gallery-prev" onClick={() => go(active - 1)} aria-label="Previous screenshot">
              <Arrow back />
            </button>
            <button type="button" className="gallery-arrow gallery-next" onClick={() => go(active + 1)} aria-label="Next screenshot">
              <Arrow />
            </button>
          </>
        ) : null}
      </div>
      {ready && many ? (
        <div className="gallery-thumbs" ref={thumbs} role="group" aria-label="Choose a screenshot">
          {project.shots.map((shot, i) => (
            <button
              type="button"
              className="gallery-thumb"
              key={shot.src}
              onClick={() => go(i)}
              aria-label={`Screenshot ${i + 1} of ${count}`}
              aria-current={i === active ? 'true' : undefined}
            >
              <img src={shot.src} alt="" width={shot.width} height={shot.height} loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
