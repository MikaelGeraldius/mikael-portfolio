// Usage: node scripts/shoot-project.mjs <url> <outPrefix> [#section ...]
// Captures a live project page for the Work section: the opening screen, then each named section scrolled to the
// top, at 1440x900 with motion settled. Writes <outPrefix>-top.jpg and <outPrefix>-<section>.jpg.
import { Browser, sleep } from '../.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const [url, prefix, ...sections] = process.argv.slice(2)
if (!url || !prefix) throw new Error('usage: shoot-project.mjs <url> <outPrefix> [#section ...]')

const browser = await Browser.launch({ width: 1440, height: 900 })
try {
  const page = await browser.newPage({ width: 1440, height: 900 })
  await page.send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await page.goto(url, { settleMs: 3500 })
  await page.screenshot({ path: `${prefix}-top.jpg`, quality: 90 })
  for (const sel of sections) {
    await page.eval((s) => {
      const el = document.querySelector(s)
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 56, behavior: 'instant' })
    }, sel)
    await sleep(2500)
    await page.screenshot({ path: `${prefix}-${sel.replace(/\W/g, '')}.jpg`, quality: 90 })
  }
} finally {
  await browser.close()
}
