// Usage: node scripts/prerender.mjs   (runs after `vite build`, see the "build" script)
// Renders <App /> to HTML and writes it into dist/index.html, so the page reads without JavaScript
// and before the bundle arrives. The client then attaches to it with hydrateRoot (src/main.tsx).
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import { createElement, StrictMode } from 'react'

const file = resolve('dist/index.html')
const template = await readFile(file, 'utf8')
if (!template.includes('<div id="root"></div>')) {
  throw new Error('prerender: dist/index.html has no empty <div id="root"></div> to fill (already pre-rendered?)')
}

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
try {
  const { default: App } = await vite.ssrLoadModule('/src/App.tsx')
  const html = renderToString(createElement(StrictMode, null, createElement(App)))
  await writeFile(file, template.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
  console.log(`prerendered ${html.length} characters of markup into dist/index.html`)
} finally {
  await vite.close()
}
