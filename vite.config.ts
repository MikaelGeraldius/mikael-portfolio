import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves a repository site from /<repository>/. The production
// base defaults to the expected repository name; override it with BASE_PATH
// (for example "/" for a custom domain or a user site) when the repo differs.
const repositoryBase = '/mikael-portfolio/'

// Link previews need absolute URLs, and the site's address is only known once it is hosted. The deploy workflow
// passes it as SITE_URL; local builds fall back to the base path, which previews on other sites cannot load.
function siteUrl(): Plugin {
  let base = '/'
  return {
    name: 'site-url',
    configResolved(config) {
      // The dev server prefixes the base onto og:image itself; the build does not.
      base = config.command === 'serve' ? '/' : config.base
    },
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => {
        const url = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/?$/, '/') : base
        return html.replaceAll('%SITE_URL%', url)
      },
    },
  }
}

export default defineConfig(() => ({
  base: process.env.BASE_PATH ?? repositoryBase,
  plugins: [react(), siteUrl()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
}))
