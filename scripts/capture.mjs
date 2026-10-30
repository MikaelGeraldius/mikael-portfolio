// Usage: node scripts/capture.mjs <url> [outDir]
// Real-browser pass over the BUILT site (serve dist under the base path first, see `npm run serve:dist`):
//   - mount + asset checks under the base path, console/network failures, overflow
//   - no tile/box backgrounds behind text, text contrast
//   - scroll reveals sampled frame by frame (hidden -> partway -> visible), above-fold copy readable at once
//   - nav anchors driven by real mouse/touch/keyboard input: distance-scaled motion, hash, interruption
//   - reduced motion, no JavaScript, no IntersectionObserver, app bundle blocked
//   - screenshots at desktop, tablet and phone
// Exit code is non-zero when a check fails.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Browser, sleep } from '../.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const url = process.argv[2]
const outDir = process.argv[3] ?? 'screenshots/dark'
mkdirSync(outDir, { recursive: true })
const base = new URL(url).pathname

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

// This machine may report reduced motion, so every page states its preference.
async function motionPage(browser, opts = {}) {
  const page = await browser.newPage(opts)
  await page.send('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: opts.reducedMotion ? 'reduce' : 'no-preference' }],
  })
  return page
}

const shot = (page, name, extra = {}) => page.screenshot({ path: join(outDir, name), ...extra })
const scrollToSel = async (page, sel, settle = 1500) => {
  await page.eval((s) => document.querySelector(s).scrollIntoView({ block: 'start', behavior: 'instant' }), sel)
  await sleep(settle)
}
const sections = ['#education', '#focus', '#studied', '#contact']

// ---- real input -------------------------------------------------------------------------------------------
const center = (page, sel) =>
  page.eval((s) => {
    const r = document.querySelector(s).getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
  }, sel)
async function click(page, sel) {
  const { x, y } = await center(page, sel)
  await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y })
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 })
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 })
}
async function tap(page, sel) {
  const { x, y } = await center(page, sel)
  await page.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
  await page.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
const wheel = (page, deltaY = 80) => page.send('Input.dispatchMouseEvent', { type: 'mouseWheel', x: 300, y: 400, deltaX: 0, deltaY })
const keys = {
  Tab: { key: 'Tab', code: 'Tab', windowsVirtualKeyCode: 9, nativeVirtualKeyCode: 9 },
  Enter: { key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, nativeVirtualKeyCode: 13, text: '\r' },
  ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', windowsVirtualKeyCode: 40, nativeVirtualKeyCode: 40 },
}
async function press(page, name) {
  const k = keys[name]
  await page.send('Input.dispatchKeyEvent', { type: k.text ? 'keyDown' : 'rawKeyDown', ...k })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...k })
}

// scrollY, frame by frame
const startSampler = (page) =>
  page.eval(() => {
    window.__s = []
    const t0 = performance.now()
    const tick = () => {
      window.__s.push([performance.now() - t0, scrollY])
      window.__raf = requestAnimationFrame(tick)
    }
    tick()
    return true
  })
const stopSampler = (page) =>
  page.eval(() => {
    cancelAnimationFrame(window.__raf)
    return window.__s
  })

// First movement to the last frame more than 1px from where the page ended.
function analyse(s) {
  const y0 = s[0][1]
  const yEnd = s.at(-1)[1]
  const first = s.findIndex(([, y]) => Math.abs(y - y0) > 0.5)
  if (first < 0) return { moved: false, y0, yEnd }
  let last = s.length - 1
  while (last > 0 && Math.abs(s[last][1] - yEnd) <= 1) last--
  const tStart = s[first][0]
  const tEnd = s[Math.min(last + 1, s.length - 1)][0]
  const duration = tEnd - tStart
  const frames = s.slice(first, last + 2).filter((p, i, a) => i === 0 || p[1] !== a[i - 1][1]).length
  const at40 = s.find(([t]) => t >= tStart + duration * 0.4)
  return { moved: true, y0, yEnd, duration: Math.round(duration), frames, progressAt40: at40 ? Math.abs(at40[1] - y0) / Math.abs(yEnd - y0) : 0 }
}
const topOf = (page, sel) => page.eval((s) => document.querySelector(s).getBoundingClientRect().top, sel)
const hashOf = (page) => page.eval(() => location.hash)

// ---- 1. mount, assets, console ---------------------------------------------------------------------------
async function mountAndAssets(browser) {
  console.log('\n== app mounts at the base path ==')
  const page = await motionPage(browser, { width: 1440, height: 900 })
  const responses = []
  const failed = []
  await page.send('Network.enable')
  browser.on(page.sessionId, 'Network.responseReceived', (p) => responses.push({ url: p.response.url, status: p.response.status }))
  browser.on(page.sessionId, 'Network.loadingFailed', (p) => failed.push(p.errorText))
  const logs = []
  await page.send('Log.enable')
  browser.on(page.sessionId, 'Log.entryAdded', (p) => {
    if (p.entry.level === 'error' || p.entry.level === 'warning') logs.push(`${p.entry.level}: ${p.entry.text} ${p.entry.url ?? ''}`)
  })
  await page.goto(url, { settleMs: 2200 })
  await scrollToSel(page, '#focus', 2200)

  const html = await page.eval(() => document.documentElement.outerHTML)
  check('index.html is served at the base path', responses.some((r) => r.url === url && r.status === 200))
  const assets = responses.filter((r) => /\.(js|css|woff2|svg)$/.test(new URL(r.url).pathname))
  const outside = assets.filter((r) => !new URL(r.url).pathname.startsWith(base))
  check('every JS/CSS/font/icon request is under the base path', outside.length === 0, outside.map((r) => r.url).join(', '))
  for (const kind of ['js', 'css', 'woff2']) {
    const found = assets.filter((r) => r.url.endsWith('.' + kind))
    check(`${kind} assets loaded with 200 (${found.length})`, found.length > 0 && found.every((r) => r.status === 200), found.map((r) => `${r.status} ${new URL(r.url).pathname}`).join(' | '))
  }
  const lazy = assets.find((r) => /FocusScene-.*\.js$/.test(r.url))
  check('lazy 3D chunk loaded from the base path', !!lazy && lazy.status === 200, lazy ? lazy.url : 'not requested')
  check('no failed network requests', failed.length === 0, failed.join(', '))
  const mounted = await page.eval(() => ({
    rootChildren: document.getElementById('root').children.length,
    h1: document.querySelector('h1')?.textContent.replace(/\s+/g, ' ').trim(),
    ready: document.documentElement.classList.contains('ready'),
    fallback: document.documentElement.classList.contains('reveal-fallback'),
    canvas: !!document.querySelector('canvas'),
    fonts: [document.fonts.check('16px Gambarino'), document.fonts.check('500 16px "General Sans"')],
  }))
  check('React mounted (root populated, "ready" set, no reveal fallback)', mounted.rootChildren > 0 && mounted.ready && !mounted.fallback, JSON.stringify(mounted))
  check('h1 reads the full name', mounted.h1 === 'Mikael Geraldius Gunawan', mounted.h1)
  check('3D canvas mounted in Focus', mounted.canvas)
  check('self-hosted fonts loaded', mounted.fonts.every(Boolean))
  check('no uncaught page exceptions', page.consoleErrors.length === 0, page.consoleErrors.join(' | '))
  check('no console errors or warnings (includes hydration mismatches)', logs.length === 0, logs.join(' | '))
  check('no external hosts requested', responses.every((r) => /^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(r.url)))
  check('dark ground: body background is dark', await page.eval(() => {
    const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number)
    return r < 40 && g < 40 && b < 40
  }))
  check('links to mailto and tel still present', await page.eval(() => {
    const h = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    return h.some((x) => x.startsWith('mailto:ops.gege.lie@gmail.com')) && !h.some((x) => x.startsWith('tel:'))
  }))
  writeFileSync(join(outDir, 'rendered.html'), html)
  await page.close()
}

// ---- 2. no backgrounds on text, contrast ------------------------------------------------------------------
async function textBackgrounds(browser) {
  console.log('\n== no tile or box backgrounds behind text ==')
  for (const [name, opts] of [['desktop', { width: 1440, height: 900 }], ['phone', { width: 390, height: 844, mobile: true }]]) {
    const page = await motionPage(browser, opts)
    await page.goto(url, { settleMs: 1500 })
    // Reveal everything first so nothing is judged in its hidden state.
    await page.eval(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 500) {
        scrollTo({ top: y, behavior: 'instant' })
        await new Promise((r) => setTimeout(r, 60))
      }
    })
    await sleep(1300)
    const r = await page.eval(() => {
      const alpha = (c) => {
        const m = c.match(/rgba?\(([^)]+)\)/)
        if (!m) return 0
        const p = m[1].split(/[ ,/]+/).filter(Boolean)
        return p.length >= 4 ? Number(p[3]) : 1
      }
      const allowed = '.button, .skip-link' // the call-to-action buttons are controls, not text tiles
      const offenders = []
      let withText = 0
      for (const el of document.body.querySelectorAll('*')) {
        const own = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
        if (!own) continue
        withText++
        if (el.closest(allowed)) continue
        const cs = getComputedStyle(el)
        if (alpha(cs.backgroundColor) > 0) offenders.push(`${el.tagName.toLowerCase()}.${el.className} bg ${cs.backgroundColor}`)
        if (cs.backgroundImage !== 'none') offenders.push(`${el.tagName.toLowerCase()}.${el.className} image`)
        for (const pseudo of ['::before', '::after']) {
          const ps = getComputedStyle(el, pseudo)
          if (ps.content !== 'none' && ps.content !== 'normal' && (alpha(ps.backgroundColor) > 0 || ps.backgroundImage !== 'none')) offenders.push(`${el.tagName.toLowerCase()}.${el.className}${pseudo}`)
        }
        // an inline-level ancestor painting a box behind this text
        for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) {
          if (/^inline/.test(getComputedStyle(a).display) && alpha(getComputedStyle(a).backgroundColor) > 0 && !a.closest(allowed)) offenders.push(`inline ancestor ${a.tagName.toLowerCase()}.${a.className}`)
        }
      }
      // elements that painted the old tiles must be gone entirely
      const legacy = document.querySelectorAll('.tok, [class*="name-tok"], [data-mark]').length
      return { withText, offenders, legacy }
    })
    check(`${name}: text elements with own/pseudo/inline-ancestor background: none (${r.withText} text elements scanned)`, r.offenders.length === 0, r.offenders.slice(0, 6).join(' | '))
    check(`${name}: no token/name-tile elements remain in the DOM`, r.legacy === 0, String(r.legacy))
    const c = await page.eval(() => {
      const parse = (s) => s.match(/[\d.]+/g).map(Number)
      const lum = ([r, g, b]) => {
        const f = (v) => ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)
      }
      const bgOf = (el) => {
        for (let e = el; e; e = e.parentElement) {
          const m = getComputedStyle(e).backgroundColor.match(/[\d.]+/g).map(Number)
          if (m.length < 4 || m[3] > 0.99) return m.slice(0, 3)
        }
        return [14, 17, 21]
      }
      let min = 99
      let worst = ''
      for (const el of document.body.querySelectorAll('*')) {
        if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue
        if (el.closest('.visually-hidden, .skip-link, .topic-map-labels')) continue
        const cs = getComputedStyle(el)
        const fg = parse(cs.color).slice(0, 3)
        const [a, b] = [lum(fg), lum(bgOf(el))]
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
        const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700)
        const need = large ? 3 : 4.5
        if (ratio - need < min) {
          min = ratio - need
          worst = `${el.tagName.toLowerCase()}.${el.className} ${ratio.toFixed(2)}:1 (needs ${need})`
        }
      }
      return { min, worst }
    })
    check(`${name}: every text element meets contrast (4.5:1, 3:1 large)`, c.min >= 0, c.worst)
    await page.close()
  }
}

// ---- 3. reveals actually animate ---------------------------------------------------------------------------
async function reveals(browser) {
  console.log('\n== scroll reveals run in the production build ==')
  const page = await motionPage(browser, { width: 1440, height: 900 })
  await page.goto(url, { settleMs: 2200 })

  // Above the fold: readable on the first frames, nothing waiting on an animation.
  const fold = await page.eval(() => {
    const vis = (el) => {
      let o = 1
      for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity)
      return o
    }
    const h = document.querySelector('h1')
    const s = document.querySelector('.hero-sentence')
    const b = document.querySelector('.hero .button')
    return { h1: vis(h), sentence: vis(s), button: vis(b), sentenceAnims: s.getAnimations({ subtree: true }).length, buttonAnims: b.getAnimations({ subtree: true }).length, hasReveal: !!document.querySelector('.hero .reveal') }
  })
  check('above the fold: name, sentence and button fully opaque, sentence and button never animated, none are .reveal', fold.h1 === 1 && fold.sentence === 1 && fold.button === 1 && fold.sentenceAnims === 0 && fold.buttonAnims === 0 && !fold.hasReveal, JSON.stringify(fold))

  const early = await motionPage(browser, { width: 1440, height: 900 })
  await early.goto(url, { settleMs: 0 })
  const first = await early.eval(() => {
    const s = document.querySelector('.hero-sentence')
    const b = document.querySelector('.hero .button')
    const line = document.querySelector('.name-line-inner')
    const ty = new DOMMatrix(getComputedStyle(line).transform).m42
    return { sentence: Number(getComputedStyle(s).opacity), button: Number(getComputedStyle(b).opacity), nameShift: Math.round(ty), nameHeight: Math.round(line.getBoundingClientRect().height) }
  })
  check('right after load: sentence and button opaque, name already inside its mask (shift under 40% of its height)', first.sentence === 1 && first.button === 1 && Math.abs(first.nameShift) < first.nameHeight * 0.4, JSON.stringify(first))
  await early.close()

  // Every below-the-fold piece of copy sits inside a reveal.
  const uncovered = await page.eval(() => {
    const out = []
    for (const el of document.querySelectorAll('main h2, main h3, main p, main dt, main dd, main li, main a, main button, main label, footer p, footer a')) {
      if (el.closest('.site-header, .skip-link, .topic-map-labels')) continue
      const top = el.getBoundingClientRect().top + scrollY
      if (top < innerHeight) continue
      if (!el.closest('[data-reveal]')) out.push(`${el.tagName.toLowerCase()}.${el.className}:${(el.textContent || '').trim().slice(0, 24)}`)
    }
    return out
  })
  check('every below-the-fold heading, paragraph, list item, link and button is inside a reveal', uncovered.length === 0, uncovered.slice(0, 6).join(' | '))
  const startHidden = await page.eval(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => el.getBoundingClientRect().top > innerHeight).every((el) => getComputedStyle(el).opacity === '0' && new DOMMatrix(getComputedStyle(el).transform).m42 >= 20))
  check('below-the-fold reveals start hidden and 24px low (opacity 0, translated)', startHidden)

  // Frame-by-frame: heading, paragraph, button, list row, group.
  // Each target is measured on a page that has not revealed anything yet.
  const targets = [
    ['fact      .fact', '.fact:nth-child(2)'],
    ['heading  #studied-title', '#studied-title'],
    ['list row  .studied-row (6th)', '.studied-row:nth-child(6)'],
    ['paragraph .studied-note', '.studied-note'],
    ['contact   .contact-method (Email)', '.contact-method'],
  ]
  for (const [label, sel] of targets) {
    const rp = await motionPage(browser, { width: 1440, height: 900 })
    await rp.goto(url, { settleMs: 1500 })
    const before = await rp.eval((s) => {
      const cs = getComputedStyle(document.querySelector(s))
      return { o: Number(cs.opacity), y: new DOMMatrix(cs.transform).m42, isIn: document.querySelector(s).classList.contains('is-in') }
    }, sel)
    const series = await rp.eval(async (s) => {
      const el = document.querySelector(s)
      el.scrollIntoView({ block: 'center', behavior: 'instant' })
      const out = []
      const t0 = performance.now()
      while (performance.now() - t0 < 1600) {
        const cs = getComputedStyle(el)
        out.push([Math.round(performance.now() - t0), Number(Number(cs.opacity).toFixed(3)), Number(new DOMMatrix(cs.transform).m42.toFixed(2))])
        await new Promise((r) => requestAnimationFrame(r))
      }
      return out
    }, sel)
    const mid = series.filter(([, o]) => o > 0.05 && o < 0.95).length
    const midY = series.filter(([, , y]) => y > 1 && y < 22).length
    const last = series.at(-1)
    const fade = series.find(([, o]) => o >= 0.95)
    let rising = true
    for (let i = 1; i < series.length; i++) if (series[i][2] > series[i - 1][2] + 0.5) rising = false
    check(`reveal ${label}: hidden → partway → visible`, before.o === 0 && !before.isIn && mid >= 3 && midY >= 3 && last[1] === 1 && last[2] === 0 && rising, `before ${before.o}/${before.y}px; ${mid} frames mid-fade, ${midY} mid-rise; opaque by ${fade ? fade[0] : '—'}ms; end ${last[1]}/${last[2]}px`)
    await rp.close()
  }

  // Stagger exists only where siblings enter together: the facts enter as a row; a lone paragraph does not wait.
  // Each is read on a page that has not revealed it yet.
  for (const [label, sel, scrollSel, expect] of [
    ['facts row enters as a group: delays step by 70ms in reading order', '.fact', '.facts', '0ms,70ms,140ms'],
    ['a lone paragraph (studied note) enters with no delay', '.studied-note', '.studied-note', '0ms'],
  ]) {
    const fresh = await motionPage(browser, { width: 1440, height: 900 })
    await fresh.goto(url, { settleMs: 1500 })
    const delays = await fresh.eval(async (a) => {
      document.querySelector(a.scrollSel).scrollIntoView({ block: 'center', behavior: 'instant' })
      await new Promise((r) => setTimeout(r, 150))
      return [...document.querySelectorAll(a.sel)].map((el) => el.style.getPropertyValue('--d')).join()
    }, { sel, scrollSel })
    check(label, delays === expect, delays)
    await fresh.close()
  }

  // Keyboard focus landing on a pending reveal shows it.
  await page.eval(() => scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(300)
  const kb = await page.eval(async () => {
    const wrap = document.querySelector('.focus-detail')
    wrap.classList.remove('is-in')
    const before = getComputedStyle(wrap).opacity
    wrap.querySelector('button').focus({ preventScroll: true })
    await new Promise((r) => setTimeout(r, 1100))
    return { before, entered: wrap.classList.contains('is-in'), after: getComputedStyle(wrap).opacity }
  })
  check('keyboard focus landing in a pending reveal shows it', kb.entered && kb.after === '1', JSON.stringify(kb))
  await page.close()
}

// ---- 4. anchor navigation with real input -----------------------------------------------------------------
async function anchors(browser) {
  console.log('\n== nav anchors: real clicks ==')
  const page = await motionPage(browser, { width: 1440, height: 900 })
  await page.goto(url, { settleMs: 2000 })
  const offset = await page.eval(() => parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))
  check('header offset is half the header (28px): the target meets the header midline', offset === 28, String(offset))
  check('CSS smooth scrolling is not what moves the page', (await page.eval(() => getComputedStyle(document.documentElement).scrollBehavior)) === 'auto')

  const run = async (selector, waitMs = 1700) => {
    await startSampler(page)
    await click(page, selector)
    await sleep(waitMs)
    return analyse(await stopSampler(page))
  }

  const near = await run('.site-header a[href="#education"]')
  const nearTop = await topOf(page, '#education')
  const nearHash = await hashOf(page)
  check('near anchor (Education): animated over many frames, ends on the target, hash updated', near.moved && near.frames >= 10 && Math.abs(nearTop - 28) <= 2 && nearHash === '#education', JSON.stringify({ ...near, top: Math.round(nearTop), hash: nearHash }))
  check('near anchor: exponential ease-out (≥85% of the distance done at 40% of the time)', near.progressAt40 >= 0.85, near.progressAt40.toFixed(2))
  await shot(page, 'desktop-anchor-end.jpg')

  await page.eval(() => scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(300)
  await startSampler(page)
  await click(page, '.site-header a[href="#contact"]')
  await sleep(300)
  await shot(page, 'desktop-anchor-mid-flight.jpg')
  await sleep(1500)
  const far = analyse(await stopSampler(page))
  const farTop = await topOf(page, '#contact')
  const farHash = await hashOf(page)
  const reachedBottom = await page.eval(() => Math.abs(scrollY - (document.documentElement.scrollHeight - innerHeight)) <= 1)
  check('far anchor (Contact): animated, ends on the target (or the page end), hash updated', far.moved && far.frames >= 15 && (Math.abs(farTop - 28) <= 2 || reachedBottom) && farHash === '#contact', JSON.stringify({ ...far, top: Math.round(farTop), hash: farHash }))
  check('duration scales with distance: far trip ≥1.5× the near trip, both inside 300–1300ms', far.duration >= near.duration * 1.5 && near.duration >= 300 && far.duration <= 1300, `near ${near.duration}ms (${Math.round(Math.abs(near.yEnd - near.y0))}px), far ${far.duration}ms (${Math.round(Math.abs(far.yEnd - far.y0))}px)`)

  const up = await run('.site-header .wordmark', 1700)
  const upHash = await hashOf(page)
  const upY = await page.eval(() => scrollY)
  check('logo from the bottom: animated back to the top, hash #top', up.moved && up.frames >= 15 && upY === 0 && upHash === '#top', JSON.stringify({ ...up, y: upY, hash: upHash }))
  await page.eval(() => history.back())
  await sleep(500)
  check('history entries were added: Back returns to the previous hash', (await hashOf(page)) === '#contact', await hashOf(page))

  // Retarget mid-flight: a second click replaces the first without a jump.
  await page.eval(() => scrollTo({ top: 0, behavior: 'instant' }))
  await sleep(300)
  await startSampler(page)
  await click(page, '.site-header a[href="#contact"]')
  await sleep(200)
  await click(page, '.site-header a[href="#studied"]')
  await sleep(1700)
  const retarget = await stopSampler(page)
  const maxJump = retarget.reduce((m, p, i) => (i ? Math.max(m, Math.abs(p[1] - retarget[i - 1][1])) : 0), 0)
  const studiedTop = await topOf(page, '#studied')
  check('a second click mid-flight retargets smoothly to its own anchor', Math.abs(studiedTop - 28) <= 2 && (await hashOf(page)) === '#studied' && maxJump < 400, `studied top ${Math.round(studiedTop)}, biggest single-frame move ${Math.round(maxJump)}px`)
  await page.close()

  // Interruption by wheel, key and touch.
  console.log('\n== interruption by user input ==')
  const interrupt = async (label, makePage, start, interruptFn) => {
    const p = await makePage()
    await p.goto(url, { settleMs: 1800 })
    const targetY = await p.eval(() => document.querySelector('#contact').getBoundingClientRect().top + scrollY - 28)
    await startSampler(p)
    await start(p)
    await sleep(110)
    const yAtInterrupt = await p.eval(() => scrollY)
    await interruptFn(p)
    await sleep(900)
    const y1 = await p.eval(() => scrollY)
    await sleep(600)
    const y2 = await p.eval(() => scrollY)
    await stopSampler(p)
    const left = targetY - y2
    check(`${label}: animation stops where it was (target ${Math.round(left)}px further, settled)`, yAtInterrupt > 50 && left > 150 && Math.abs(y2 - y1) <= 1, `at interrupt ${Math.round(yAtInterrupt)}px, ended ${Math.round(y2)}px, target ${Math.round(targetY)}px`)
    await p.close()
  }
  await interrupt('wheel', () => motionPage(browser, { width: 1440, height: 900 }), (p) => click(p, '.site-header a[href="#contact"]'), (p) => wheel(p, 60))
  await interrupt('keyboard (ArrowDown)', () => motionPage(browser, { width: 1440, height: 900 }), (p) => click(p, '.site-header a[href="#contact"]'), (p) => press(p, 'ArrowDown'))
  await interrupt('touch', () => motionPage(browser, { width: 390, height: 844, mobile: true, dsf: 2 }), (p) => tap(p, '.site-header a[href="#contact"]'), (p) =>
    p.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 500 }] }).then(() => p.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })),
  )
}

// ---- 5. keyboard navigation -------------------------------------------------------------------------------
async function keyboard(browser) {
  console.log('\n== keyboard ==')
  const page = await motionPage(browser, { width: 1440, height: 900 })
  await page.goto(url, { settleMs: 2000 })
  let found = false
  for (let i = 0; i < 12 && !found; i++) {
    await press(page, 'Tab')
    await sleep(80)
    found = await page.eval(() => document.activeElement?.getAttribute('href') === '#contact')
  }
  const ring = await page.eval(() => {
    const cs = getComputedStyle(document.activeElement)
    return cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2
  })
  check('Tab reaches the Contact link and it shows a focus ring', found && ring)
  await startSampler(page)
  await press(page, 'Enter')
  await sleep(1700)
  const s = analyse(await stopSampler(page))
  const after = await page.eval(() => ({ hash: location.hash, active: document.activeElement?.id, top: document.querySelector('#contact').getBoundingClientRect().top }))
  check('Enter on the link scrolls smoothly, updates the hash and moves focus to the section', s.moved && s.frames >= 15 && after.hash === '#contact' && after.active === 'contact' && Math.abs(after.top - 28) <= 2, JSON.stringify({ frames: s.frames, duration: s.duration, ...after }))
  await press(page, 'Tab')
  await sleep(150)
  const next = await page.eval(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent)
  check('Tab after the jump continues from the target (first control inside Contact)', /Email ops\.gege\.lie@gmail\.com/.test(next ?? ''), String(next))
  await page.close()
}

// ---- 6. reduced motion ------------------------------------------------------------------------------------
async function reducedMotion(browser) {
  console.log('\n== reduced motion ==')
  const page = await motionPage(browser, { width: 1440, height: 900, reducedMotion: true })
  await page.goto(url, { settleMs: 700 })
  const s = await page.eval(() => {
    const all = [...document.querySelectorAll('.reveal, .name-line-inner, .button, .hero-sentence')]
    return {
      visible: all.every((el) => getComputedStyle(el).opacity === '1'),
      still: all.every((el) => getComputedStyle(el).transform === 'none'),
      animations: document.getAnimations().length,
      scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    }
  })
  check('reduced: all copy visible and untransformed before any scroll', s.visible && s.still, JSON.stringify(s))
  check('reduced: no running CSS animations or transitions', s.animations === 0, String(s.animations))
  await shot(page, 'desktop-reduced-hero.jpg')
  await startSampler(page)
  await click(page, '.site-header a[href="#contact"]')
  await sleep(700)
  const a = analyse(await stopSampler(page))
  const after = await page.eval(() => ({ hash: location.hash, top: document.querySelector('#contact').getBoundingClientRect().top, active: document.activeElement?.id }))
  check('reduced: anchor click is the browser’s immediate jump (≤3 frames), hash set, ends on the target', a.moved && a.frames <= 3 && after.hash === '#contact' && Math.abs(after.top - 28) <= 2, JSON.stringify({ ...a, ...after }))
  await shot(page, 'desktop-reduced-contact.jpg')
  const stillVisible = await page.eval(() => [...document.querySelectorAll('.reveal')].every((el) => getComputedStyle(el).opacity === '1' && getComputedStyle(el).transform === 'none'))
  check('reduced: every reveal element visible after jumping', stillVisible)
  await page.close()
}

// ---- 7. failure modes -------------------------------------------------------------------------------------
async function failureModes(browser) {
  console.log('\n== fallbacks ==')
  const allVisible = (p) => p.eval(() => [...document.querySelectorAll('.reveal')].every((el) => getComputedStyle(el).opacity === '1' && getComputedStyle(el).transform === 'none'))
  const variants = [
    ['IntersectionObserver missing', "delete window.IntersectionObserver"],
    ['IntersectionObserver throws', "window.IntersectionObserver = class { constructor() { throw new Error('observer unavailable') } }"],
    ['IntersectionObserver never calls back', "window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }"],
  ]
  for (const [label, source] of variants) {
    const page = await motionPage(browser, { width: 1440, height: 900 })
    await page.send('Page.addScriptToEvaluateOnNewDocument', { source })
    await page.goto(url, { settleMs: 3200 })
    // The 3D map's own observer is the same stub: the page must still read in full.
    check(`${label}: every reveal element is visible within 3s, no page exceptions`, (await allVisible(page)) && page.consoleErrors.length === 0, page.consoleErrors.join(' | '))
    await page.close()
  }
  const blocked = await motionPage(browser, { width: 1440, height: 900 })
  await blocked.send('Network.enable')
  await blocked.send('Network.setBlockedURLs', { urls: ['*.js'] })
  await blocked.goto(url, { settleMs: 3800 })
  const b = await blocked.eval(() => ({ app: document.documentElement.classList.contains('ready'), fallback: document.documentElement.classList.contains('reveal-fallback'), text: document.body.innerText.includes('ops.gege.lie@gmail.com') && document.body.innerText.includes('What I’ve studied') }))
  check('app bundle blocked: pre-rendered page falls back to fully visible within 3.8s', !b.app && b.fallback && b.text && (await allVisible(blocked)), JSON.stringify(b))
  await shot(blocked, 'desktop-app-blocked.jpg', { fullPage: true })
  await blocked.close()

  const page = await browser.newPage({ width: 1440, height: 900 })
  await page.send('Emulation.setScriptExecutionDisabled', { value: true })
  await page.goto(url, { settleMs: 1200 })
  await shot(page, 'desktop-nojs-hero.jpg')
  await shot(page, 'desktop-nojs-full.jpg', { fullPage: true })
  // With script off Runtime.evaluate is blocked, so read the document through the DOM domain.
  const { root } = await page.send('DOM.getDocument', { depth: -1 })
  const { outerHTML } = await page.send('DOM.getOuterHTML', { nodeId: root.nodeId })
  const text = outerHTML.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ')
  check('no-JS: pre-rendered, and the "js" class that hides reveals is absent', !/<html[^>]*class="[^"]*\bjs\b/.test(outerHTML) && outerHTML.includes('class="hero"'))
  for (const phrase of ['Mikael', 'Gunawan', 'Informatics student', 'Studying Informatics', 'AI and web design', 'What I’ve studied', 'TypeScript', 'Kotlin', 'Get in touch', 'ops.gege.lie@gmail.com']) {
    check(`no-JS: shows "${phrase}"`, text.includes(phrase))
  }
  await page.close()
}

// ---- 8. screenshots at three sizes ------------------------------------------------------------------------
async function viewportShots(browser) {
  console.log('\n== screenshots and layout ==')
  for (const [name, opts] of [
    ['desktop', { width: 1440, height: 900 }],
    ['tablet', { width: 768, height: 1024 }],
    ['phone', { width: 390, height: 844, dsf: 2, mobile: true }],
  ]) {
    const page = await motionPage(browser, opts)
    await page.goto(url, { settleMs: 2000 })
    await shot(page, `${name}-hero.jpg`)
    const role = await page.eval(() => {
      const h = document.querySelector('h1').getBoundingClientRect()
      const p = document.querySelector('.hero-sentence')
      const r = p.getBoundingClientRect()
      const b = document.querySelector('.hero .button').getBoundingClientRect()
      return { gap: Math.round(r.top - h.bottom), sentenceBottom: Math.round(r.bottom), buttonBottom: Math.round(b.bottom), vh: innerHeight, size: parseFloat(getComputedStyle(p).fontSize), opacity: Number(getComputedStyle(p).opacity) }
    })
    check(`${name}: role sentence ≤80px under the name, ≥18px, sentence and button on the first screen`, role.gap >= 0 && role.gap <= 80 && role.size >= 18 && role.sentenceBottom <= role.vh && role.buttonBottom <= role.vh && role.opacity === 1, JSON.stringify(role))
    for (const sel of sections) {
      await scrollToSel(page, sel, 1700)
      await shot(page, `${name}-${sel.slice(1)}.jpg`)
    }
    await page.eval(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        scrollTo({ top: y, behavior: 'instant' })
        await new Promise((r) => setTimeout(r, 140))
      }
      scrollTo({ top: 0, behavior: 'instant' })
    })
    await sleep(1500)
    const pending = await page.eval(() =>
      [...document.querySelectorAll('[data-reveal]')].filter((el) => !el.classList.contains('is-in')).map((el) => {
        const r = el.getBoundingClientRect()
        return `${el.tagName.toLowerCase()}.${el.className.replace(/\s+/g, '.')} top ${Math.round(r.top + scrollY)} h ${Math.round(r.height)} (page ${document.documentElement.scrollHeight}, vh ${innerHeight})`
      }),
    )
    check(`${name}: every reveal ran after scrolling the page`, pending.length === 0, pending.join(' | '))
    const overflow = await page.eval(() => ({ doc: document.documentElement.scrollWidth, vw: innerWidth }))
    check(`${name}: no horizontal overflow`, overflow.doc <= overflow.vw, JSON.stringify(overflow))
    await shot(page, `${name}-full.jpg`, { fullPage: true })
    await page.close()
  }
}

const browser = await Browser.launch({ width: 1440, height: 900 })
try {
  await mountAndAssets(browser)
  await textBackgrounds(browser)
  await reveals(browser)
  await anchors(browser)
  await keyboard(browser)
  await reducedMotion(browser)
  await failureModes(browser)
  await viewportShots(browser)
} finally {
  await browser.close()
}
const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
writeFileSync(join(outDir, 'capture-results.json'), JSON.stringify(results, null, 2))
process.exit(failed.length ? 1 : 0)
