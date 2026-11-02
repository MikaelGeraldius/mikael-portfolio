# Mikael's portfolio: working rules

Read this first. The full design system is `DESIGN.md`, product facts are `PRODUCT.md`, every word on the page is
`src/content.ts`. This file is the short version, plus mistakes made before.

Live: https://mikaelgeraldius.github.io/mikael-portfolio/ (GitHub Pages; a push to `main` deploys via
`.github/workflows/deploy.yml`, about a minute).

## How Mikael works with you

- **Show a preview before anything goes live.** He often uses Remote Control, so he cannot see the browser pane or
  localhost: take screenshots and send them with `SendUserFile` (desktop 1440 and phone 390), then ask.
- **Commit and push only when he says so.** "Commit and push" means: commit to `main`, push, watch the deploy
  (`gh run watch <id> --exit-status`), then confirm the live page has the change (curl it).
- **No empty space.** He rejected layouts with a narrow text column beside an empty one. Fill the width: put related
  parts side by side, run lists in two columns, let text span its columns.
- **Only real facts.** No invented projects, metrics, quotes, roles or skills. Group work is credited to the whole
  group by name, with his part stated plainly (see the song mood classifier's `credit`).
- When a request is genuinely ambiguous, ask; otherwise act and say what you assumed.

## Skills to load for design work

Installed in `~/.claude/skills` (and `.claude/skills`): load all three before touching UI.

- `impeccable`: run `~/.claude/skills/impeccable/scripts/impeccable context --target <file>` once per session,
  then read its `reference/craft-floor.md` before editing.
- `emil-design-eng`: motion decisions (purpose, ease-out, under 300ms for UI, press scale 0.97, never from scale 0).
- `design-taste-frontend`: house rules, `npm run lint:taste`, and the inspector (`npm run inspect`).

Known inspector results that predate the redesign (not regressions): the "Email" label in Contact reads as an
eyebrow, only 2 pictures, a long Education statement, and uneven margins at 1440.

## Design system in brief

- **Fields:** ground `#0e1115`, raised `#151a21`, deep `#090b0e`. Sections separate by tone, never by line or shadow.
- **Ink:** `#eef1f5` for all running text; `#a7b1be` only for supporting notes. **One accent** `#ff6b3d`: the words
  AI and web design, buttons, link underlines, the 3D hubs. Never decoration.
- **Type:** Gambarino for the name and headings, General Sans for everything read. Five sizes only (`--t-display`,
  `--t-head`, `--t-lead`, `--t-body`, `--t-small`). Sentence case.
- **Banned:** gradients, shadows on things at rest, glows, glass, hairline rules, eyebrows/kickers, index numbers,
  monospace outside code, pills or chips behind text, emoji, icon-topped cards. Lists of tools are plain text with
  middle dots.
- **Flat and square:** `border-radius: 0` everywhere. Buttons: accent fill, ink on hover, `scale(0.97)` on press.
- **The one card:** the work card, a whole-field tone step (`--ground` on the raised section), the only filled surface.
- **Motion:** transform and opacity only; ease-out curves from `:root` (`--ease-out`, `--ease-expo`); hover effects
  behind `@media (hover: hover) and (pointer: fine)`; everything has a reduced-motion version and reads without JS
  (the page is prerendered by `scripts/prerender.mjs`). Scroll reveals use `class="reveal" data-reveal`.
- **Smooth scroll everywhere:** anything that scrolls, the page or a box that scrolls on its own, glides with
  Lenis at the same settings (`lerp: 0.09`). The page uses `useSmoothScroll`; a box that scrolls itself, like a
  project page, uses `smoothScrollWithin(el)` from `src/hooks.ts` (and keeps `data-lenis-prevent` so the page's
  instance leaves it alone). Never add a scrolling area without it; off under reduced motion.

## Work section and project pages

- Cards: `src/components/Projects.tsx`. One project shows one wide card; two or more sit two to a row.
- Each project has a page at `#work-<slug>` (`src/components/ProjectPages.tsx`, routing in `src/route.ts`). Pages are
  always in the markup (CSS `:target` opens them without JS); with JS a View Transition morphs the card's picture
  into the page's. Back, Escape and "All work" close it; "Next project" replaces history rather than pushing.
- Page layout: title; summary (+ credit) across 8 columns with Year / Platform / Kind in the last 4; screenshots on
  a deep panel; What it does (8 cols) beside Built with (4); What I learned as two columns, each lesson
  `"The point: the detail"` (the part before `: ` becomes its bold title, so write every lesson that way and never
  start the detail with a code name, it gets capitalised).

**Adding a project:** add an entry to `projects` in `src/content.ts` (slug, name, kind, year, platform, meta, blurb,
summary, optional credit and site, does, learned, stack, repo, `frame: 'phone' | 'screen'`, shots with width and
height). Screenshots go in `public/projects/` as WebP (`ffmpeg -i in.jpg -c:v libwebp -quality 82 out.webp`). For a
live web project, capture with `node scripts/shoot-project.mjs <url> <outPrefix> '#section' ...`. Then update the
project list test in `src/content.test.ts`, `PRODUCT.md` (content truth), and the Studied list and topic map with
what it taught.

## Focus topic map

- Data: `topicNodes` and `groups` in `src/content.ts`; layout: `src/graph.ts`; rendering and labels:
  `src/topicMap.ts`; React glue: `src/components/Focus.tsx`, `FocusScene.tsx`.
- Layout: Informatics in the middle, AI and Web design below on either side, each with a ring of up to **7** topics
  (`ringAngles`; keep the slot under the hub and the direction back to Informatics clear), and the "Also studied"
  topics in an arc of **5** above Informatics (`otherArc`). Adding more means new angles and fresh screenshots of
  every view at 1440 and 390.
- Topic labels sit outward from their hub; hub labels caption their ring (`HUB_CAPTION`); labels are clamped inside
  the map. Clicking Informatics returns to the overview (camera, list, summary).
- When the node count changes, update `src/content.test.ts` (`nodesForGroup`) and the counts in `scripts/verify.mjs`
  (overview labels, fallback list).

## Checking your work

```bash
npm test && npm run lint:taste
npm run build && npm run serve:dist     # serves dist on http://127.0.0.1:4791/mikael-portfolio/ (leave it running)
npm run verify                          # 43/44 expected: "reduced: all content visible ... before any scrolling"
                                        # has always failed; anything else failing is yours
```

- **The in-app browser pane lies about motion:** it emulates reduced motion and pauses animations when hidden, so
  reveals look stuck and View Transitions are skipped. Judge motion and take preview screenshots in headless Chrome
  with the CDP helper at `.claude/skills/design-taste-frontend/scripts/lib/cdp.mjs` (`Browser.launch`,
  `newPage({ width, height, mobile, dsf })`, `goto`, `eval`, `screenshot`, `send`), against the served build.
- After hot reloads, reload the page before trusting what you see; stale modules once left the work cards blank.

## Tests that guard content

- Page markup must not contain "case study" or "lorem ipsum" (`src/App.test.tsx`, `scripts/verify.mjs`).
- `studied`, `topicNodes` and `groups` must not contain the word "project", "github.com" or "linkedin"
  (`src/content.test.ts`): name the work instead ("RegionMusic", "the song mood classifier").
- Speak in the first person; never "he", "his" or "Mikael is".

## Shell gotchas on this machine

- Windows + Git Bash: backslashes inside heredocs get eaten. Write scripts with the Write tool (scratchpad), then
  run them; run Python with `python -I`.
- Don't commit `.claude/`, `.taste-skill/`, `screenshots/` or font files (all gitignored; fonts are fetched at build).
