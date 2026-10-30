import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import 'lenis/dist/lenis.css'
import App from './App'
import './styles.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production build ships the page pre-rendered (scripts/prerender.mjs), so it reads without script;
// attach to that markup. The dev server has none, so it renders from scratch.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
