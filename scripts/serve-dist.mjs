// Usage: node scripts/serve-dist.mjs [port] [base]
// Serves ./dist under the GitHub Pages base path, the way Pages would (static files only).
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const port = Number(process.argv[2] ?? 4173)
const base = process.argv[3] ?? '/mikael-portfolio/'
const root = resolve('dist')
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.json': 'application/json',
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  if (!url.pathname.startsWith(base)) {
    res.writeHead(404).end('Not found')
    return
  }
  let rel = decodeURIComponent(url.pathname.slice(base.length)) || 'index.html'
  if (rel.endsWith('/')) rel += 'index.html'
  const file = normalize(join(root, rel))
  if (!file.startsWith(root)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  try {
    if (!(await stat(file)).isFile()) throw new Error('not a file')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
  }
}).listen(port, '127.0.0.1', () => console.log(`serving dist at http://127.0.0.1:${port}${base}`))
