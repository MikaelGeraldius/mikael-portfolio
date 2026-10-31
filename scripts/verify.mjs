// Usage: node scripts/verify.mjs <url> [outDir]
// Drives the built site in headless Chrome and checks interaction states.
// Exit code is non-zero if any check fails. Screenshots go to outDir.
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { Browser, sleep } from '../.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const url = process.argv[2]
const outDir = process.argv[3] ?? 'screenshots'
mkdirSync(outDir, { recursive: true })

const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const keyDef = {
  Tab: { code: 'Tab', vk: 9 },
  Enter: { code: 'Enter', vk: 13, text: '\r' },
  ArrowLeft: { code: 'ArrowLeft', vk: 37 },
  ArrowRight: { code: 'ArrowRight', vk: 39 },
  ArrowDown: { code: 'ArrowDown', vk: 40 },
  ArrowUp: { code: 'ArrowUp', vk: 38 },
  Home: { code: 'Home', vk: 36 },
}
async function press(page, key, modifiers = 0) {
  const d = keyDef[key]
  const base = { key, code: d.code, windowsVirtualKeyCode: d.vk, nativeVirtualKeyCode: d.vk, modifiers }
  await page.send('Input.dispatchKeyEvent', { type: d.text ? 'keyDown' : 'rawKeyDown', ...base, text: d.text })
  await page.send('Input.dispatchKeyEvent', { type: 'keyUp', ...base })
  await sleep(120)
}

// This machine's OS may report reduced motion, so every page states its preference explicitly.
async function newPage(browser, opts = {}) {
  const page = await browser.newPage(opts)
  if (!opts.reducedMotion) {
    await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
  }
  return page
}

const rectOf = (page, selector) =>
  page.eval(
    (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const r = el.getBoundingClientRect()
      return { x: r.x, y: r.y, w: r.width, h: r.height, sx: scrollX, sy: scrollY }
    },
    selector,
  )

async function shot(page, name) {
  const path = join(outDir, name)
  await page.screenshot({ path, quality: 80 })
  return path
}
async function sectionShot(page, selector, name) {
  const r = await rectOf(page, selector)
  const path = join(outDir, name)
  await page.screenshot({
    path,
    quality: 80,
    clip: { x: r.x + r.sx, y: r.y + r.sy, width: r.w, height: Math.min(r.h, page.viewport.height) },
  })
}
const scrollTo = async (page, selector) => {
  await page.eval((sel) => document.querySelector(sel).scrollIntoView({ block: 'start', behavior: 'instant' }), selector)
  await sleep(1400)
}
const frameHash = async (page, selector = '.topic-map-stage') => {
  const r = await rectOf(page, selector)
  return page.screenshot({ format: 'jpeg', quality: 50, clip: { x: r.x + r.sx, y: r.y + r.sy, width: r.w, height: r.h } })
}

async function fullDesktopChecks(browser) {
  console.log('\n== desktop 1440 ==')
  const page = await newPage(browser, { width: 1440, height: 900 })
  const external = []
  await page.send('Network.enable')
  browser.on(page.sessionId, 'Network.requestWillBeSent', (p) => {
    if (!/^(http:\/\/127\.0\.0\.1|data:|blob:)/.test(p.request.url)) external.push(p.request.url)
  })
  await page.goto(url, { settleMs: 1800 })
  await shot(page, 'desktop-hero.jpg')

  check('h1 is the full name on two lines', await page.eval(() => {
    const h = document.querySelector('h1')
    return h.textContent.replace(/\s+/g, ' ').trim() === 'Mikael Geraldius Gunawan' && h.querySelectorAll('.name-line').length === 2
  }))
  check('first viewport has sentence + one action', await page.eval(() => {
    const vh = innerHeight
    const s = document.querySelector('.hero-sentence').getBoundingClientRect()
    const b = document.querySelector('.hero .button').getBoundingClientRect()
    return s.bottom <= vh && b.bottom <= vh && b.height >= 44
  }))
  check('no 3D canvas in the opening viewport', await page.eval(() => !document.querySelector('canvas')))
  check('contact links are correct', await page.eval(() => {
    const hrefs = [...document.querySelectorAll('a')].map((a) => a.getAttribute('href'))
    return hrefs.some((h) => h.startsWith('mailto:ops.gege.lie@gmail.com')) && !hrefs.some((h) => h.startsWith('tel:'))
  }))
  check('no project cards or placeholder work', await page.eval(() => !/project (one|1)|lorem|placeholder|case study/i.test(document.body.innerText)))
  check('Gambarino and General Sans loaded', await page.eval(async () => {
    await document.fonts.ready
    return document.fonts.check('16px Gambarino') && document.fonts.check('500 16px "General Sans"')
  }))
  check('header tone ground at top', (await page.eval(() => document.querySelector('.site-header').dataset.headerTone)) === 'ground')

  // Chapter colour + header
  await scrollTo(page, '#education')
  check('header takes raised tone over Education', (await page.eval(() => document.querySelector('.site-header').dataset.headerTone)) === 'raised')
  await scrollTo(page, '#focus')
  await sleep(600)
  check('header takes deep tone over Focus', (await page.eval(() => document.querySelector('.site-header').dataset.headerTone)) === 'deep')
  await sleep(500)

  // Scene is lazy-loaded, then present
  const canvasState = await page.eval(() => {
    const c = document.querySelector('canvas')
    return c ? { w: c.clientWidth, h: c.clientHeight } : null
  })
  check('3D canvas mounted below the opening and sized', !!canvasState && canvasState.w > 300 && canvasState.h > 300, JSON.stringify(canvasState))
  const labelCount = await page.eval(() => document.querySelectorAll('.topic-map-label:not(.is-hidden)').length)
  // The degree, the two focus areas and the five other studies.
  check('overview shows 8 labels', labelCount === 8, String(labelCount))
  await sectionShot(page, '#focus', 'desktop-focus-overview.jpg')

  // Radio group via keyboard
  await page.eval(() => document.querySelector('.picker input:checked').focus())
  await press(page, 'ArrowRight')
  const afterArrow = await page.eval(() => ({
    value: document.querySelector('.picker input:checked').value,
    readout: document.querySelector('.readout').textContent,
    buttons: [...document.querySelectorAll('.topic-list button')].map((b) => b.textContent),
  }))
  check('ArrowRight on radio selects AI and updates list + readout', afterArrow.value === 'ai' && afterArrow.buttons.includes('Machine learning') && /Machine learning/.test(afterArrow.readout), JSON.stringify(afterArrow.buttons))
  await sleep(900)
  await sectionShot(page, '#focus', 'desktop-focus-ai.jpg')

  // Topic list via keyboard (Tab to a button, Enter to select)
  await page.eval(() => [...document.querySelectorAll('.topic-list button')].find((b) => b.textContent === 'Claude').focus())
  await press(page, 'Enter')
  const sel = await page.eval(() => ({
    pressed: [...document.querySelectorAll('.topic-list button[aria-pressed="true"]')].map((b) => b.textContent),
    readout: document.querySelector('.readout').textContent,
  }))
  check('Enter on a topic selects it and the readout names it', sel.pressed.join() === 'Claude' && /^Claude\./.test(sel.readout), JSON.stringify(sel))
  await sleep(700)
  await sectionShot(page, '#focus', 'desktop-focus-selected.jpg')

  // Keyboard orbit on the map
  await page.eval(() => document.querySelector('.topic-map').focus())
  const before = await frameHash(page)
  for (let i = 0; i < 4; i++) await press(page, 'ArrowLeft')
  await press(page, 'ArrowUp')
  await sleep(900)
  const after = await frameHash(page)
  check('arrow keys turn the map', before !== after)
  await press(page, 'Home')
  await sleep(900)
  check('map focus ring is visible', await page.eval(() => {
    const el = document.querySelector('.topic-map')
    const cs = getComputedStyle(el)
    return document.activeElement === el && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) >= 2
  }))

  // Mouse drag orbit
  const stage = await rectOf(page, '.topic-map-stage')
  const cx = stage.x + stage.w / 2
  const cy = stage.y + stage.h * 0.75
  const beforeDrag = await frameHash(page)
  await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 })
  for (let i = 1; i <= 10; i++) {
    await page.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cx + i * 14, y: cy, button: 'left', buttons: 1 })
    await sleep(20)
  }
  await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: cx + 140, y: cy, button: 'left', clickCount: 1 })
  await sleep(900)
  check('mouse drag turns the map', beforeDrag !== (await frameHash(page)))

  // Click a node in the 3D view: back to overview, click the Web design hub
  await page.eval(() => document.querySelector('.picker input[value="all"]').click())
  await sleep(1100)
  const hubLabel = await page.eval(() => {
    const el = [...document.querySelectorAll('.topic-map-label')].find((l) => l.textContent === 'Web design')
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y }
  })
  // The hub's label is its ring's caption, some way under the hub: step up from it until a click lands on the hub.
  let hubPick = { group: 'all', readout: '' }
  for (let lift = 30; lift <= 220 && hubPick.group !== 'web'; lift += 15) {
    const tap = { x: hubLabel.x, y: hubLabel.y - lift }
    await page.send('Input.dispatchMouseEvent', { type: 'mousePressed', x: tap.x, y: tap.y, button: 'left', clickCount: 1 })
    await page.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: tap.x, y: tap.y, button: 'left', clickCount: 1 })
    await sleep(500)
    hubPick = await page.eval(() => ({
      group: document.querySelector('.picker input:checked').value,
      readout: document.querySelector('.readout').textContent,
    }))
  }
  await sleep(500)
  check('clicking the Web design hub in 3D selects it and zooms the group', hubPick.group === 'web' && /^Web design\./.test(hubPick.readout), JSON.stringify(hubPick))
  await sectionShot(page, '#focus', 'desktop-focus-web.jpg')

  // Remaining sections
  await scrollTo(page, '#studied')
  await sectionShot(page, '#studied', 'desktop-studied.jpg')
  await scrollTo(page, '#contact')
  await shot(page, 'desktop-contact.jpg')

  // Whole page: reveals completed after scrolling, no horizontal overflow
  await page.eval(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 500) {
      scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
  })
  await sleep(800)
  check('every .reveal element entered after scrolling', await page.eval(() => [...document.querySelectorAll('.reveal')].every((el) => el.classList.contains('is-in'))))
  check('no uncaught page exceptions', page.consoleErrors.length === 0, page.consoleErrors.join(' | '))
  check('no external requests (no font CDN, no analytics)', external.length === 0, external.join(', '))
  await page.close()
}

async function overflowChecks(browser) {
  console.log('\n== overflow at widths ==')
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const page = await newPage(browser, { width, height: 900, mobile: width < 700 })
    await page.goto(url, { settleMs: 900 })
    const m = await page.eval(() => ({
      doc: document.documentElement.scrollWidth,
      vw: innerWidth,
      wide: [...document.querySelectorAll('h1 .name-line, .contact-link, .studied-area, h2')]
        .filter((el) => el.scrollWidth > el.clientWidth + 1 || el.getBoundingClientRect().right > innerWidth + 1)
        .map((el) => el.textContent.slice(0, 24)),
    }))
    check(`no horizontal overflow at ${width}px`, m.doc <= m.vw && m.wide.length === 0, `doc ${m.doc} vs ${m.vw} ${m.wide.join(',')}`)
    await page.close()
  }
}

async function touchChecks(browser) {
  console.log('\n== phone 390 touch ==')
  const page = await newPage(browser, { width: 390, height: 844, dsf: 2, mobile: true })
  await page.goto(url, { settleMs: 1500 })
  await shot(page, 'phone-hero.jpg')
  await scrollTo(page, '#focus')
  await page.eval(() => window.scrollBy(0, 280))
  await sleep(1500)
  await shot(page, 'phone-focus.jpg')
  const stage = await rectOf(page, '.topic-map-stage')
  check('phone: canvas present and fits viewport width', !!stage && stage.w <= 390 && stage.h > 250, JSON.stringify(stage))
  const labels = await page.eval(() => document.querySelectorAll('.topic-map-label:not(.is-hidden)').length)
  check('phone: overview labels visible', labels === 8, String(labels))

  const touch = (type, x, y) => page.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y }] })
  const cx = stage.x + stage.w / 2
  const cy = stage.y + stage.h / 2
  const before = await frameHash(page)
  await touch('touchStart', cx - 60, cy)
  for (let i = 1; i <= 8; i++) {
    await touch('touchMove', cx - 60 + i * 15, cy)
    await sleep(20)
  }
  await touch('touchEnd')
  await sleep(900)
  check('phone: horizontal touch drag turns the map', before !== (await frameHash(page)))

  // Tap the AI hub label's node
  await page.eval(() => document.querySelector('.picker input[value="all"]').click())
  await sleep(900)
  const hub = await page.eval(() => {
    const el = [...document.querySelectorAll('.topic-map-label')].find((l) => l.textContent === 'AI')
    const r = el.getBoundingClientRect()
    return { x: r.x + r.width / 2, y: r.y }
  })
  await touch('touchStart', hub.x, hub.y - 18)
  await touch('touchEnd')
  await sleep(900)
  const picked = await page.eval(() => ({ group: document.querySelector('.picker input:checked').value, readout: document.querySelector('.readout').textContent }))
  check('phone: tapping the AI hub selects it', picked.group === 'ai' && /^AI\./.test(picked.readout), JSON.stringify(picked))

  // Vertical swipe over the canvas still scrolls the page
  const y0 = await page.eval(() => scrollY)
  const st = await rectOf(page, '.topic-map-stage')
  const sx = st.x + st.w / 2
  const sy = st.y + st.h * 0.8
  await touch('touchStart', sx, sy)
  for (let i = 1; i <= 12; i++) {
    await touch('touchMove', sx, sy - i * 18)
    await sleep(16)
  }
  await touch('touchEnd')
  await sleep(600)
  const y1 = await page.eval(() => scrollY)
  check('phone: vertical swipe over the map scrolls the page', y1 > y0 + 100, `${y0} -> ${y1}`)

  // Touch targets
  const small = await page.eval(() =>
    [...document.querySelectorAll('a, button, .picker label')]
      .map((el) => ({ t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20), h: el.getBoundingClientRect().height, w: el.getBoundingClientRect().width }))
      .filter((o) => o.h > 0 && o.h < 40),
  )
  check('phone: interactive targets at least 40px tall', small.length === 0, JSON.stringify(small))
  await scrollTo(page, '#contact')
  await shot(page, 'phone-contact.jpg')
  check('phone: no page exceptions', page.consoleErrors.length === 0, page.consoleErrors.join(' | '))
  await page.close()
}

async function tabletShots(browser) {
  const page = await newPage(browser, { width: 768, height: 1024 })
  await page.goto(url, { settleMs: 1500 })
  await shot(page, 'tablet-hero.jpg')
  await scrollTo(page, '#focus')
  await page.eval(() => window.scrollBy(0, 260))
  await sleep(1300)
  await shot(page, 'tablet-focus.jpg')
  await page.close()
}

async function reducedMotionChecks(browser) {
  console.log('\n== reduced motion ==')
  const page = await newPage(browser, { width: 1440, height: 900, reducedMotion: true })
  await page.goto(url, { settleMs: 600 })
  const state = await page.eval(() => ({
    anim: getComputedStyle(document.querySelector('.name-line-inner')).animationName,
    revealOpacity: [...document.querySelectorAll('.reveal')].every((el) => getComputedStyle(el).opacity === '1'),
    transform: [...document.querySelectorAll('.reveal')].every((el) => getComputedStyle(el).transform === 'none'),
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
  }))
  check('reduced: hero name has no animation', state.anim === 'none', state.anim)
  check('reduced: all content visible with no travel, before any scrolling', state.revealOpacity && state.transform)
  check('reduced: smooth scrolling off', state.scrollBehavior === 'auto', state.scrollBehavior)
  await scrollTo(page, '#focus')
  const a = await frameHash(page)
  await sleep(1800)
  const b = await frameHash(page)
  check('reduced: map is static (no idle drift)', a === b)
  await page.eval(() => document.querySelector('.picker input[value="web"]').click())
  await sleep(150)
  const snapped = await frameHash(page)
  await sleep(900)
  check('reduced: group change snaps without animation', snapped === (await frameHash(page)))
  await sectionShot(page, '#focus', 'desktop-focus-reduced-motion.jpg')
  await page.close()

  const moving = await newPage(browser, { width: 1440, height: 900 })
  await moving.goto(url, { settleMs: 600 })
  await scrollTo(moving, '#focus')
  const m1 = await frameHash(moving)
  await sleep(1500)
  check('normal motion: map idles with a slow sway', m1 !== (await frameHash(moving)))
  await moving.close()
}

async function fallbackChecks() {
  console.log('\n== WebGL unavailable ==')
  const browser = await Browser.launch({ width: 1440, height: 900, extraArgs: ['--disable-gpu', '--disable-3d-apis', '--disable-webgl', '--disable-webgl2', '--disable-software-rasterizer'] })
  try {
    const page = await newPage(browser, { width: 1440, height: 900 })
    await page.goto(url, { settleMs: 1200 })
    const hasGl = await page.eval(() => {
      const c = document.createElement('canvas')
      return !!(c.getContext('webgl2') || c.getContext('webgl'))
    })
    if (hasGl) {
      check('fallback: could not disable WebGL in this Chrome (test skipped)', false, 'WebGL still available')
    } else {
      await scrollTo(page, '#focus')
      const f = await page.eval(() => ({
        canvas: !!document.querySelector('canvas'),
        message: document.querySelector('.scene-fallback')?.textContent ?? '',
        buttons: document.querySelectorAll('.topic-list button').length,
      }))
      check('fallback: no canvas, plain message shown', !f.canvas && /not available/.test(f.message), f.message.slice(0, 60))
      check('fallback: topic list still present', f.buttons === 8, String(f.buttons))
      await page.eval(() => document.querySelector('.picker input[value="web"]').click())
      await sleep(300)
      check('fallback: list + readout still work', await page.eval(() => document.querySelectorAll('.topic-list button').length === 8 && /frontend/i.test(document.querySelector('.readout').textContent)))
      await sectionShot(page, '#focus', 'desktop-focus-no-webgl.jpg')
      check('fallback: no page exceptions', page.consoleErrors.length === 0, page.consoleErrors.join(' | '))
    }
    await page.close()
  } finally {
    await browser.close()
  }
}

const browser = await Browser.launch({ width: 1440, height: 900 })
try {
  await fullDesktopChecks(browser)
  await overflowChecks(browser)
  await touchChecks(browser)
  await tabletShots(browser)
  await reducedMotionChecks(browser)
} finally {
  await browser.close()
}
await fallbackChecks()

const failed = results.filter((r) => !r.ok)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
writeFileSync(join(outDir, 'verify-results.json'), JSON.stringify(results, null, 2))
process.exit(failed.length ? 1 : 0)
