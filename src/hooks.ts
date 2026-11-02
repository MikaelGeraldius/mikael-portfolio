import Lenis from 'lenis'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { anchorDuration, anchorTarget, clamp, easeOutExpo } from './scroll'

const reducedQuery = '(prefers-reduced-motion: reduce)'

/** The running smooth-scroll instance, shared so in-page links glide on the same engine as the wheel. */
let lenis: Lenis | null = null

/**
 * Wheel and trackpad scrolling eases toward its target instead of jumping in steps. Touch keeps the
 * platform's own scrolling. Off under reduced motion.
 */
export function useSmoothScroll(reduced: boolean) {
  useEffect(() => {
    if (reduced) return
    const instance = new Lenis({ lerp: 0.09, wheelMultiplier: 1, autoRaf: true })
    lenis = instance
    return () => {
      instance.destroy()
      if (lenis === instance) lenis = null
    }
  }, [reduced])
}

/**
 * The same smooth scrolling inside a box that scrolls on its own, such as an open project page. Returns the
 * cleanup. Nothing under reduced motion.
 */
export function smoothScrollWithin(wrapper: HTMLElement): () => void {
  if (window.matchMedia(reducedQuery).matches) return () => {}
  const instance = new Lenis({ wrapper, content: wrapper, lerp: 0.09, wheelMultiplier: 1, autoRaf: true })
  return () => instance.destroy()
}

/** Holds the page still while a project page lies over it, and lets it go again. */
export function setSmoothScrollPaused(paused: boolean) {
  if (paused) lenis?.stop()
  else lenis?.start()
}

function subscribeReduced(callback: () => void) {
  const mq = window.matchMedia(reducedQuery)
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

export function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(reducedQuery).matches,
    () => false,
  )
}

export type Tone = 'ground' | 'raised' | 'deep'

export interface Chapter {
  tone: Tone
  /** The section's id, so the header can mark where the visitor is. Empty for the hero and footer. */
  id: string
}

/**
 * Where the visitor is. The header takes the colour of the chapter under its midline. The marked link is the
 * section being read, found separately: the last section whose top has passed a reading line a third of the way
 * down the viewport. That line sits well inside a section an anchor link has just brought up, so subpixel resting
 * positions on scaled displays cannot tip it to the section above. At the end of the page the last section is
 * marked, since a short final section never reaches the line or the header.
 */
export function useChapter(headerHeight = 56): Chapter {
  const [chapter, setChapter] = useState<Chapter>({ tone: 'ground', id: '' })
  useEffect(() => {
    const chapters = Array.from(document.querySelectorAll<HTMLElement>('[data-tone]'))
    const sections = chapters.filter((el) => el.tagName === 'SECTION')
    let frame = 0
    const measure = () => {
      frame = 0
      const line = headerHeight / 2
      // Half a pixel of slack, applied to both edges so neighbours never both match.
      const under = chapters.find((el) => {
        const rect = el.getBoundingClientRect()
        return rect.top <= line + 0.5 && rect.bottom > line + 0.5
      })
      const root = document.documentElement
      // A few pixels of slack: on scaled displays the page can rest a device pixel or two short of its end.
      const atEnd = window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 4
      const reading = window.innerHeight / 3
      const current = atEnd
        ? sections[sections.length - 1]
        : sections.filter((el) => el.getBoundingClientRect().top <= reading).pop()
      setChapter((prev) => {
        // Nothing under the line (overscroll past an edge): keep the colour it had.
        const next = { tone: (under?.dataset.tone as Tone) ?? prev.tone, id: current?.id ?? '' }
        return prev.tone === next.tone && prev.id === next.id ? prev : next
      })
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    // Sections change height without a scroll (fonts, the map loading), which moves every boundary.
    const ro = new ResizeObserver(schedule)
    ro.observe(document.body)
    return () => {
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      if (frame) cancelAnimationFrame(frame)
    }
  }, [headerHeight])
  return chapter
}

/**
 * Marks `[data-reveal]` elements as entered once they scroll into view, once each.
 * Content is visible by default in CSS; this only adds the entrance. Elements that enter in the same
 * frame (a list, a row of facts, a heading beside its paragraph) are staggered 70ms apart in reading
 * order; a lone element enters with no delay. Under reduced motion the CSS keeps only the fade, no travel.
 */
export function useRevealOnScroll() {
  useEffect(() => {
    document.documentElement.classList.add('ready')
    const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'))
    const showAll = () => items.forEach((el) => el.classList.add('is-in'))
    if (!('IntersectionObserver' in window)) {
      showAll()
      return
    }
    let io: IntersectionObserver
    let called = false
    try {
      io = new IntersectionObserver(
        (entries) => {
          called = true
          const entering = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
          // Stagger only real groups: siblings that enter together (the facts, a heading and its paragraph).
          const placed = new Map<Element | null, number>()
          entering.forEach((entry) => {
            const el = entry.target as HTMLElement
            const index = placed.get(el.parentElement) ?? 0
            placed.set(el.parentElement, index + 1)
            el.style.setProperty('--d', `${Math.min(index, 4) * 70}ms`)
            el.classList.add('is-in')
            io.unobserve(el)
          })
        },
        { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
      )
      items.forEach((el) => io.observe(el))
    } catch {
      // An observer that cannot start must never leave copy hidden.
      showAll()
      return
    }
    // Keyboard reading: focus landing inside something still waiting to enter shows it at once.
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as Element | null
      const pending = target?.closest<HTMLElement>('[data-reveal]')
      if (pending) {
        pending.style.setProperty('--d', '0ms')
        pending.classList.add('is-in')
      }
    }
    document.addEventListener('focusin', onFocusIn)
    // The observer's bottom margin means the last lines of a page can sit wholly inside it when the page is
    // scrolled to its end. At the end of the page, show whatever is on screen.
    let frame = 0
    const revealAtEnd = () => {
      frame = 0
      const root = document.documentElement
      if (window.innerHeight + window.scrollY < root.scrollHeight - 2) return
      for (const el of items) {
        if (el.classList.contains('is-in')) continue
        const rect = el.getBoundingClientRect()
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          el.classList.add('is-in')
          io.unobserve(el)
        }
      }
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(revealAtEnd)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    // A working observer reports every observed element once, straight away. If it stays silent, show the copy.
    const watchdog = window.setTimeout(() => {
      if (!called) showAll()
    }, 2000)
    return () => {
      window.clearTimeout(watchdog)
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      io.disconnect()
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [])
}

/** Keys that scroll the page: pressing one while an anchor scroll runs hands the page back to the visitor. */
const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '])

/**
 * In-page links (`a[href="#id"]`: the logo, the section links, skip link, back to top) scroll to their target
 * with an exponential ease-out whose duration grows with the distance. The hash and history entry are
 * updated and focus moves to the target, as with a native jump. Wheel, touch, a scrollbar drag, or a
 * scrolling key stops the animation where it is. The visitor asked for the trip, so it glides under reduced motion too.
 */
export function useSmoothAnchors() {
  useEffect(() => {
    let frame = 0
    let release: (() => void) | null = null

    const cancel = () => {
      if (frame) cancelAnimationFrame(frame)
      frame = 0
      release?.()
      release = null
    }

    const animateTo = (target: number) => {
      cancel()
      const from = window.scrollY
      const distance = Math.abs(target - from)
      if (distance < 2) return
      const duration = anchorDuration(distance)
      // With smooth scrolling on, hand the trip to it: a wheel turn mid-flight then redirects it rather than fighting it.
      if (lenis) {
        const instance = lenis
        instance.scrollTo(target, { duration: duration / 1000, easing: easeOutExpo, onComplete: () => cancel() })
        // Lenis redirects on a wheel turn itself; a touch, a press or a scrolling key must stop it here,
        // or a long trip runs on to the end under the visitor's finger.
        const stopLenis = (event: Event) => {
          if (event.type === 'keydown' && !SCROLL_KEYS.has((event as KeyboardEvent).key)) return
          instance.stop()
          instance.start()
          cancel()
        }
        const lenisTypes = ['touchstart', 'mousedown', 'keydown'] as const
        lenisTypes.forEach((type) => window.addEventListener(type, stopLenis, { passive: true }))
        release = () => lenisTypes.forEach((type) => window.removeEventListener(type, stopLenis))
        return
      }
      const start = performance.now()
      let expected = from

      const interrupt = (event: Event) => {
        if (event.type === 'keydown' && !SCROLL_KEYS.has((event as KeyboardEvent).key)) return
        cancel()
      }
      const types = ['wheel', 'touchstart', 'mousedown', 'keydown'] as const
      types.forEach((type) => window.addEventListener(type, interrupt, { passive: true }))
      release = () => types.forEach((type) => window.removeEventListener(type, interrupt))

      const step = (now: number) => {
        // The page moved by something other than this loop (scrollbar drag, find in page): let go.
        if (Math.abs(window.scrollY - expected) > 2) {
          cancel()
          return
        }
        const t = clamp((now - start) / duration, 0, 1)
        expected = from + (target - from) * easeOutExpo(t)
        window.scrollTo({ top: expected, behavior: 'instant' })
        if (t < 1) frame = requestAnimationFrame(step)
        else cancel()
      }
      frame = requestAnimationFrame(step)
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest<HTMLAnchorElement>('a[href^="#"]')
      const hash = anchor?.getAttribute('href')
      if (!anchor || !hash || hash.length < 2) return
      const target = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (!target) return
      event.preventDefault()
      const root = document.documentElement
      const offset = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0
      const top = target.getBoundingClientRect().top + window.scrollY
      const y = anchorTarget(top, offset, root.scrollHeight - window.innerHeight)
      if (window.location.hash !== hash) window.history.pushState(null, '', hash)
      // As with a native jump, keyboard reading continues from the target.
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
      target.focus({ preventScroll: true })
      animateTo(y)
    }

    document.addEventListener('click', onClick)
    return () => {
      document.removeEventListener('click', onClick)
      cancel()
    }
  }, [])
}

/** True once the element is within `margin` of the viewport; stays true. */
export function useNearViewport<T extends Element>(margin = '600px'): [React.RefCallback<T>, boolean] {
  const [node, setNode] = useState<T | null>(null)
  const [near, setNear] = useState(false)
  useEffect(() => {
    if (!node || near) return
    if (!('IntersectionObserver' in window)) {
      setNear(true)
      return
    }
    let io: IntersectionObserver
    try {
      io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            setNear(true)
            io.disconnect()
          }
        },
        { rootMargin: margin },
      )
      io.observe(node)
    } catch {
      setNear(true)
      return
    }
    return () => io.disconnect()
  }, [node, near, margin])
  return [setNode, near]
}
