# Mikael Geraldius Gunawan: portfolio

A one-page, type-led portfolio for internship and job applications in AI and web design. React + TypeScript +
Vite, custom CSS, and one lazy-loaded Three.js topic map. Static only: no backend, database, secrets or external
API calls. Status: **built and verified locally; not published.**

## Run it

```bash
npm install
npm run dev            # development server
npm run build          # type-check + production build into dist/, then pre-renders the page into dist/index.html
npm test               # unit tests (vitest)
npm run serve:dist     # serve dist/ under /mikael-portfolio/ like GitHub Pages, on 127.0.0.1:4791
npm run verify         # interaction checks against the served build (needs Chrome or Edge); screenshots/ is rewritten
npm run lint:taste     # Taste source linter
node scripts/capture.mjs http://127.0.0.1:4791/mikael-portfolio/ screenshots/dark
                       # base-path mount + assets, no text backgrounds, frame-sampled reveals, real-click nav anchors
                       # (distance-scaled, hash, interruption), keyboard, reduced motion, observer/no-JS fallbacks,
                       # desktop/tablet/phone shots. Serve dist first: npm run serve:dist
```

`npm run inspect -- http://127.0.0.1:4791/mikael-portfolio/ --out .taste-skill/inspect --allow few-pictures` runs
the Taste inspector (see "Known departures").

## Where things are

| Path | What |
| --- | --- |
| `src/content.ts` | Every fact on the page. The only place to edit text, contact details and the studied list. |
| `src/graph.ts`, `src/topicMap.ts` | Layout and the Three.js scene for the topic map. |
| `src/components/` | One file per section. `FocusScene.tsx` is loaded lazily. |
| `src/styles.css` | The whole visual system (tokens at the top). |
| `public/fonts/` | Self-hosted Gambarino and General Sans. See `FONTS.md`. |
| `DESIGN.md`, `.impeccable/design.json` | The design system as built. |
| `PRODUCT.md`, `.impeccable/surfaces/index.md` | Product context and the surface brief. |
| `.github/workflows/deploy.yml` | Pages deployment (not yet used). |

## Publishing to GitHub Pages (not done yet)

1. Create the repository (expected name: `mikael-portfolio`) and push. Nothing has been pushed or created.
2. Settings > Pages > Source: **GitHub Actions**. The workflow builds with `BASE_PATH=/mikael-portfolio/`.
   For another repository name, a custom domain, or a `<user>.github.io` repository, change `BASE_PATH` in
   `deploy.yml` (and the default in `vite.config.ts`).
3. Check the live site against the list below.

## Before launch

- [x] Public contact confirmed: email only (`ops.gege.lie@gmail.com`), no phone number.
- [x] Font files are kept out of the public repository and downloaded from Fontshare at build time (see `FONTS.md`).
- [x] First real project added: RegionMusic, in the Work chapter (`projects` in `src/content.ts`).
- [ ] Add further projects, a CV link and profile links only when Mikael supplies them, with images carrying their
      provenance.
- [ ] Decide on a custom domain, if wanted.
- [x] Link-preview card: `public/og.png`, regenerated with `npm run og`.

## Known departures

- `capture.mjs` "a second click mid-flight retargets smoothly" fails since the Work chapter made the page about 1,800px longer: a far anchor trip is capped at 1100ms, so the first expo-out frames move about 560px, over the check's 400px. Lengthening long trips would change the motion spec; left as is. The 8 other failures there predate the Work chapter.

- The Taste inspector's `few-pictures` rule (four or more real pictures) is allowed rather than satisfied. The
  chosen direction is type-only and the brief rules out stock photos; the topic map is the single authored visual.
- The inspector's `no-footage` warning stays: no honest clip of this subject exists.
- The display name is 12vw (about 173px at 1440), above Impeccable's 6rem display guideline: the name set as large as two lines allow is the committed first viewport.
- `.impeccable/design.json` still describes the retired olive system; regenerate it with the Impeccable documenter (not run here).
