// Renders the link-preview card (public/og.png, 1200×630) in headless Chrome, set in the site's own fonts and
// colours. Run it again after changing the name or the hero line: `npm run og`.
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Browser } from '../.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs'

const root = new URL('..', import.meta.url)
const font = (file) => readFileSync(new URL(`public/fonts/${file}`, root)).toString('base64')
// Inlined: Chrome will not load a font file into a page opened from file://.
const face = (family, file, weight) =>
  `@font-face{font-family:'${family}';src:url(data:font/woff2;base64,${font(file)}) format('woff2');font-weight:${weight}}`

const html = `<!doctype html><meta charset="utf-8"><style>
${face('Gambarino', 'Gambarino-Regular.woff2', 400)}
${face('General Sans', 'GeneralSans-Regular.woff2', 400)}
${face('General Sans', 'GeneralSans-Medium.woff2', 500)}
html,body{margin:0;width:1200px;height:630px;background:#0e1115;color:#eef1f5;-webkit-font-smoothing:antialiased}
body{box-sizing:border-box;padding:72px 80px;display:flex;flex-direction:column;justify-content:space-between}
.name{font:400 128px/0.9 'Gambarino',serif;letter-spacing:-0.03em;margin:0}
.line{font:400 34px/1.35 'General Sans',sans-serif;letter-spacing:-0.005em;margin:0;max-width:24em}
.mark{color:#ff6b3d;font-weight:500}
.foot{display:flex;justify-content:space-between;font:400 22px/1.4 'General Sans',sans-serif;color:#a7b1be;margin-top:28px}
</style>
<h1 class="name">Mikael Geraldius<br>Gunawan</h1>
<div>
  <p class="line">Informatics student looking for internships and jobs in <span class="mark">AI</span> and <span class="mark">web design</span>.</p>
  <div class="foot"><span>Universitas Multimedia Nusantara</span><span>Portfolio</span></div>
</div>`

const dir = mkdtempSync(join(tmpdir(), 'og-'))
const page = join(dir, 'card.html')
writeFileSync(page, html)
const browser = await Browser.launch({ width: 1200, height: 630 })
try {
  const tab = await browser.newPage({ width: 1200, height: 630 })
  await tab.goto(pathToFileURL(page).href, { settleMs: 300 })
  const loaded = await tab.eval(() => document.fonts.ready.then(() => [...document.fonts].filter((f) => f.status === 'loaded').length))
  if (loaded < 3) throw new Error(`only ${loaded} of 3 fonts loaded`)
  const out = new URL('public/og.png', root)
  await tab.screenshot({ path: out, format: 'png' })
  console.log('wrote', out.pathname)
} finally {
  await browser.close()
  rmSync(dir, { recursive: true, force: true })
}
