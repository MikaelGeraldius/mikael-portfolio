import { flushSync } from 'react-dom'
import { useSyncExternalStore } from 'react'
import { projects } from './content'

/**
 * Which project page is open, kept in the address as `#work-<slug>` so it can be linked to, reloaded and closed
 * with the browser's back button. Without script the same hash opens the page through CSS `:target`.
 */

const PREFIX = '#work-'
const listeners = new Set<() => void>()
/** True when the open page was opened from this page, so closing it can step back instead of adding history. */
let pushed = false

export const projectHref = (slug: string) => `${PREFIX}${slug}`

function slugFromHash(): string {
  const hash = window.location.hash
  if (!hash.startsWith(PREFIX)) return ''
  const slug = decodeURIComponent(hash.slice(PREFIX.length))
  return projects.some((p) => p.slug === slug) ? slug : ''
}

const notify = () => listeners.forEach((listener) => listener())

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('popstate', onPopState)
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) window.removeEventListener('popstate', onPopState)
  }
}

export function useOpenProject(): string {
  return useSyncExternalStore(subscribe, slugFromHash, () => '')
}

/** The card's picture, which the project page's picture grows out of and returns to. */
const cardMedia = (slug: string) => document.querySelector<HTMLElement>(`[data-card-media="${slug}"]`)

/**
 * Runs a change of page inside a view transition where the browser has them and motion is welcome: the card's
 * picture morphs into the page's, everything else crossfades. `before` and `after` run against the old and new
 * page so the card holds the shared name only on the side of the change where it is visible.
 */
function transition(slug: string, update: () => void, opening: boolean) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  // Moving from one project page to the next has no card on screen to grow from.
  const card = opening && document.querySelector('.case[data-open]') ? null : cardMedia(slug)
  if (reduced || !document.startViewTransition || !card) {
    flushSync(update)
    return
  }
  const root = document.documentElement
  root.classList.add('vt')
  if (opening) card.style.viewTransitionName = 'case-media'
  const vt = document.startViewTransition(() => {
    card.style.viewTransitionName = opening ? '' : 'case-media'
    flushSync(update)
  })
  vt.finished.finally(() => {
    card.style.viewTransitionName = ''
    root.classList.remove('vt')
  })
}

function onPopState() {
  pushed = false
  const before = document.querySelector<HTMLElement>('.case[data-open]')?.dataset.slug ?? ''
  const after = slugFromHash()
  if (before === after) return
  transition(after || before, notify, Boolean(after))
}

export function openProject(slug: string) {
  window.history.pushState(null, '', projectHref(slug))
  pushed = true
  transition(slug, notify, true)
}

export function closeProject(slug: string) {
  if (pushed) {
    // Step back to where the visitor was; popstate runs the transition.
    window.history.back()
    return
  }
  // Arrived on the project page directly: land on the work section rather than leaving the site.
  window.history.replaceState(null, '', '#projects')
  transition(slug, notify, false)
}
