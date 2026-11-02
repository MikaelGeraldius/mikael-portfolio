// Single source of truth for every fact shown on the page.
// Only details confirmed by Mikael live here. The one project is RegionMusic,
// which he built and published; there are no employers, certificates, social
// profiles or CV, so none are listed.

export const person = {
  name: 'Mikael Geraldius Gunawan',
  firstLine: 'Mikael Geraldius',
  secondLine: 'Gunawan',
  wordmark: 'Mikael G.',
  university: 'Universitas Multimedia Nusantara',
  degree: 'Informatics',
  startYear: 2024,
  semester: 5,
  graduationYear: 2028,
}

// Email only: Mikael chose not to publish a phone number.
export const contact = {
  email: 'ops.gege.lie@gmail.com',
  emailSubject: 'Opportunity for Mikael',
}

export const mailtoHref = `mailto:${contact.email}?subject=${encodeURIComponent(contact.emailSubject)}`

/** The first-screen sentence in phrases; `mark` phrases are the two focus areas. */
export const heroParts: readonly { text: string; mark?: true }[] = [
  { text: 'I’m an Informatics student' },
  { text: 'at Universitas Multimedia Nusantara,' },
  { text: 'looking for internship and job opportunities in' },
  { text: 'AI', mark: true },
  { text: 'and' },
  { text: 'web design.', mark: true },
]

export const heroSentence = heroParts.map((part) => part.text).join(' ')

export const facts = [
  { value: String(person.startYear), label: 'Started at UMN' },
  { value: String(person.semester), label: 'Current semester' },
  { value: String(person.graduationYear), label: 'Expected graduation' },
]

export interface StudyArea {
  area: string
  topics: string
}

export const studied: StudyArea[] = [
  { area: 'Frontend', topics: 'HTML, JavaScript, TypeScript, React, Tailwind CSS, Vite, Web Audio API' },
  { area: 'Backend', topics: 'MySQL, PostgreSQL, ExpressJS, Cloudflare Workers, calling third-party APIs through a proxy' },
  {
    area: 'Mobile',
    topics: 'Kotlin, Room, React Native, Expo, Android permissions, background location, standalone release builds',
  },
  {
    area: 'Machine learning',
    topics:
      'Methods implemented in Python, pandas, scikit-learn, Random Forests, evaluation against baselines, shrinking a model to run in the browser',
  },
  {
    area: 'Audio and playback',
    topics:
      'Spotify Web API with OAuth, background audio, lock-screen controls, crossfades, loop points in Python with numpy and ffmpeg',
  },
  { area: 'Maps and location', topics: 'OpenStreetMap data, point-in-polygon tests, smoothing GPS jitter' },
  {
    area: 'UI design',
    topics: 'Visual hierarchy, spacing grids, colour systems and theming, icon design, data visualisation, accessible interactive UI',
  },
  { area: 'Game development', topics: 'Unity, C#, a canvas game loop in React, tile maps and collisions' },
  { area: 'AI assistants', topics: 'Claude, Claude Code, ChatGPT, Gemini, Hermes' },
]

export interface Project {
  /** The project page's address: `#work-<slug>`. */
  slug: string
  name: string
  kind: string
  year: string
  platform: string
  meta: string
  /** One line for the card; the summary opens the project page. */
  blurb: string
  summary: string
  does: string
  learned: string[]
  stack: string
  repo: string
  /** A live version to try, when there is one. */
  site?: string
  /** Who else built it and which part is Mikael's, for group work. */
  credit?: string
  /** How the screenshots are framed: tall phone screens side by side, or wide browser screens stacked. */
  frame: 'phone' | 'screen'
  shots: { src: string; alt: string; width: number; height: number }[]
  shotsCaption: string
}

const shot = (file: string) => `${import.meta.env.BASE_URL}projects/${file}`

export const projects: Project[] = [
  // Group 3's Machine Learning final project at UMN (2026); Mikael rebuilt it as the web page, live on GitHub
  // Pages. Facts and numbers come from the repository's README and LEARNED.md.
  {
    slug: 'mood-classifier',
    name: 'Song mood classifier',
    kind: 'Course project',
    year: '2026',
    platform: 'Web',
    meta: 'Machine Learning final project · 2026 · Web',
    blurb: 'Paste a Spotify link or upload a song, and a Random Forest running in your browser names its mood.',
    summary:
      'A Random Forest that names a song’s mood (sad, happy, energetic or calm) from nine audio features, trained on 277,938 labelled songs.',
    credit:
      'It began as the Machine Learning final project of Group 3 at Universitas Multimedia Nusantara: Alto Dev, Claudia Wiyadi Gunawan, Gerald Fedorian, Mikael Geraldius Gunawan and Nadine Kay Ludony. I turned it into a web page so anyone can try the model in their browser, with nothing to install.',
    does:
      'Paste a Spotify link or upload an audio file and the page gets the song’s nine audio features, then the forest names the mood and shows how sure it is. Sliders show how each feature would move the answer, and the results set the 92.3% accuracy on 55,588 unseen songs beside simple baselines and a confusion matrix.',
    learned: [
      'A score needs a baseline beside it: always answering “happy” gets 38.3% and logistic regression 83.5%, so the forest’s real gain is about nine points, a smaller and more honest claim than “92%”.',
      'Checking what a cleaning step actually did: the CSV’s index column made every row unique, so drop_duplicates() removed nothing, and 547 test songs had a twin in training.',
      'Reading feature importance: valence was under 5% of it, while instrumentalness, energy and acousticness alone reach 79.9%. The labels follow a song’s texture more than its positivity.',
      'Shipping a model is a size problem: cutting 9.2 million nodes to 357 thousand cost about one point of accuracy, packed into a 1.4 MB binary whose TypeScript reader agrees with scikit-learn on 99.95% of test songs.',
      'Trees don’t need feature scaling: their thresholds move with the scale but the answers don’t, so dropping the scaler made the browser model simpler.',
      'Third-party APIs change: Spotify closed audio features to new apps, so I switched to ReccoBeats behind a Cloudflare Worker, and wrote a fallback that measures loudness and tempo from the audio in the browser.',
    ],
    stack: 'Python, pandas, scikit-learn, TypeScript, React, Vite, Web Audio API, Cloudflare Workers, ReccoBeats',
    repo: 'https://github.com/MikaelGeraldius/mood-classifier',
    site: 'https://mikaelgeraldius.github.io/mood-classifier/',
    frame: 'screen',
    // Captured from the live page at 1440x900 (scripts/shoot-project.mjs).
    shots: [
      { src: shot('mood-classifier-home.webp'), alt: 'The opening of the page: “What mood is this song?”, with a dataset song the forest calls sad at 99%', width: 1440, height: 900 },
      { src: shot('mood-classifier-try.webp'), alt: 'Checking a song: a Spotify link box, an upload button, presets and feature sliders, with the verdict “Happy” at 100%', width: 1440, height: 900 },
      { src: shot('mood-classifier-results.webp'), alt: 'The results: 92.3% for the full model beside 91.3%, 83.5% and 38.3% for the page’s model and two baselines', width: 1440, height: 900 },
    ],
    shotsCaption: 'The live page: the opening, checking a song, and how often it is right.',
  },
  // Built Oct 2026; code public at the repo below. The music itself is Mikael's own
  // files and is not in the repository, so the page names no soundtrack.
  {
    slug: 'regionmusic',
    name: 'RegionMusic',
    kind: 'Personal project',
    year: '2026',
    platform: 'Android',
    meta: 'Personal project · 2026 · Android',
    blurb: 'An Android app that plays a theme for wherever you are, like the overworld of an old handheld RPG.',
    summary:
      'An Android app that plays a theme for wherever you are, like the overworld of an old handheld RPG: a city theme in malls and big buildings, a town theme in housing complexes and a route theme on the road.',
    does:
      'It follows my location in the background, even with the phone locked, works out what kind of place I’m in from OpenStreetMap, and crossfades to that place’s theme. Every place keeps its own song, and my own neighbourhood plays the starting-area music.',
    learned: [
      'Mobile development with Expo and React Native: development builds, Android permissions, background location and standalone release builds.',
      'Location logic: classifying places from OpenStreetMap data with point-in-polygon tests, and smoothing out GPS jitter so the music doesn’t flicker at borders.',
      'Playback integrations: controlling Spotify through its Web API with OAuth sign-in, then switching to local playback with background audio, lock-screen controls and crossfades.',
      'Audio processing in Python: finding each track’s loop point with autocorrelation so songs repeat with no fade or gap.',
      'UI design: visual hierarchy, an 8-point spacing grid, colour systems and theming, and drawing a pixel-art app icon.',
      'Building with an AI pair programmer: planning in phases with Claude Code, testing on a real phone and fixing what broke there.',
    ],
    stack: 'TypeScript, React Native, Expo, expo-audio, expo-location, OpenStreetMap, Python, numpy, ffmpeg',
    repo: 'https://github.com/MikaelGeraldius/RegionMusic',
    frame: 'phone',
    // Captured from the app on Mikael's phone in its demo mode, so no real location history shows.
    shots: [
      { src: shot('regionmusic-playing.webp'), alt: 'RegionMusic playing a city theme at Summarecon Mall Serpong, with today’s tally and the journey list', width: 540, height: 1145 },
      { src: shot('regionmusic-off.webp'), alt: 'RegionMusic with the music off and the pink Start music button', width: 540, height: 1145 },
    ],
    shotsCaption: 'Screens from the app on my phone, shown with sample places.',
  },
  // A final project built with Nadine Kay Ludony in June 2025 (both in the repo's history); Mikael rebuilt the HUD
  // for phones and rewrote the snake mini game in Nov 2026. Rules and numbers come from the game's code.
  {
    slug: 'wemen',
    name: 'Wemen',
    kind: 'Course project',
    year: '2025',
    platform: 'Web',
    meta: 'Final project · 2025 · Web',
    blurb: 'A pixel-art life sim in the browser: keep yourself fed, rested, clean and happy for ten days in a small town.',
    summary:
      'A pixel-art life sim in the browser: pick a character, walk around a small town, and keep your energy, hunger, hygiene and mood above zero for ten days while collecting as many coins as you can.',
    credit:
      'I made it with Nadine Kay Ludony as our final project at Universitas Multimedia Nusantara. In 2026 I came back to it, rebuilt the interface so it plays on a phone, and rewrote the snake mini game.',
    does:
      'Every in-game hour wears the four stats down, and reaching zero in any of them ends the game. Walking up to a spot offers what it is for: sleep at home after 20:00, take a bath, buy bread, chicken, steak or an energy drink, or pay 50 coins to play snake, which earns 10 coins an apple and lifts your mood. The town turns to night after dark, a fast-forward button speeds up time and the drain with it, and the final score counts the days you lasted and the coins you kept.',
    learned: [
      'A game loop inside React: the town is drawn on a canvas every animation frame, with the player’s position kept in refs so walking doesn’t re-render the page, and movement scaled by frame time so the speed holds on any screen.',
      'Tile maps: walls and action spots are one grid of tile codes, so finding the bath, the shop or the bed is a check of the player’s box against those tiles.',
      'Game state with a reducer: time, stats and coins change only through actions such as sleeping, eating and playing snake, which keeps the rules in one place.',
      'Day and night: the clock picks the day or the night map, and the rules follow it, so the bed only works after 20:00.',
      'Playing on a phone: moving the HUD out of the canvas into the page, with on-screen arrows for walking and swipes for snake, made the game work on a touchscreen.',
      'A snake that speeds up: each apple shortens the step from 140 ms toward a 65 ms cap, and the best score stays in the browser’s local storage.',
    ],
    stack: 'JavaScript, React, Vite, HTML Canvas, CSS, GitHub Pages',
    repo: 'https://github.com/MikaelGeraldius/UAS-WEMEN',
    site: 'https://mikaelgeraldius.github.io/UAS-WEMEN/',
    frame: 'screen',
    // Captured from the live game at 1440x900 in headless Chrome.
    shots: [
      { src: shot('wemen-home.webp'), alt: 'The title screen: the Wemen logo over a pixel-art village, a character to pick, a name box and a Start button', width: 1440, height: 900 },
      { src: shot('wemen-town.webp'), alt: 'The town: the player by the snake house with a Play button, the day, time and coins top left and four stat bars top right', width: 1440, height: 900 },
      { src: shot('wemen-eat.webp'), alt: 'The shop: a menu of bread, chicken, steak and an energy drink, each with its price and what it restores', width: 1440, height: 900 },
      { src: shot('wemen-snake.webp'), alt: 'The snake mini game over the dimmed town, with an apple and coin counter and the best score', width: 1440, height: 900 },
      { src: shot('wemen-night.webp'), alt: 'The town at night: the house windows lit, the clock at 20:24 and a Sleep button by the door', width: 1440, height: 900 },
      { src: shot('wemen-over.webp'), alt: 'Game over: hunger, energy and mood at zero, a final score of 700 for two days and 100 coins, and a Restart button', width: 1440, height: 900 },
    ],
    shotsCaption: 'The live game: the title screen, the town, the shop, snake, night at home, and game over.',
  },
]

export type GroupId = 'all' | 'ai' | 'web' | 'other'

export interface TopicNode {
  id: string
  label: string
  /** Which exploration group the node belongs to. */
  group: Exclude<GroupId, 'all'> | 'root'
  kind: 'root' | 'hub' | 'topic'
  parent?: string
  text: string
}

export interface GroupInfo {
  id: GroupId
  label: string
  summary: string
}

export const groups: GroupInfo[] = [
  {
    id: 'all',
    label: 'Overview',
    summary:
      'Informatics is my degree. AI and web design are where I want to take it; the rest is what I’ve studied along the way.',
  },
  {
    id: 'ai',
    label: 'AI',
    summary:
      'Machine learning in Python, from course methods to a Random Forest built with pandas and scikit-learn, and the four AI assistants I use every day.',
  },
  {
    id: 'web',
    label: 'Web design',
    summary:
      'The frontend stack I’ve studied and built with: HTML for structure, JavaScript and TypeScript for behaviour, React for components, Tailwind CSS for styling, Vite to build, and the Web Audio API for sound.',
  },
  {
    id: 'other',
    label: 'Also studied',
    summary: 'Backend, mobile, audio, location and game development, studied and built alongside my two focus areas.',
  },
]

export const topicNodes: TopicNode[] = [
  {
    id: 'informatics',
    label: 'Informatics',
    group: 'root',
    kind: 'root',
    text: 'My degree at Universitas Multimedia Nusantara. Started in 2024, expected to finish in 2028.',
  },
  {
    id: 'ai',
    label: 'AI',
    group: 'ai',
    kind: 'hub',
    parent: 'informatics',
    text: 'One of my two focus areas: machine learning in Python with pandas and scikit-learn, and AI assistants I use every day.',
  },
  {
    id: 'web',
    label: 'Web design',
    group: 'web',
    kind: 'hub',
    parent: 'informatics',
    text: 'One of my two focus areas: the frontend, with HTML, JavaScript, TypeScript, React, Tailwind CSS, Vite and the Web Audio API.',
  },
  {
    id: 'backend',
    label: 'Backend',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Databases and servers, studied with MySQL, PostgreSQL and ExpressJS. A Cloudflare Worker proxies the song mood classifier’s requests.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Android apps, studied with Kotlin and Room. RegionMusic is built with React Native and Expo, with background location and release builds.',
  },
  {
    id: 'game',
    label: 'Game development',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Games, studied with Unity and C#. Wemen is a pixel-art life sim drawn on a canvas in React, with tile-map collisions and a snake mini game.',
  },
  {
    id: 'audio',
    label: 'Audio',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Spotify’s Web API with OAuth, background audio and crossfades in RegionMusic, and finding loop points in Python with numpy and ffmpeg.',
  },
  {
    id: 'location',
    label: 'Location',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'OpenStreetMap data in RegionMusic: point-in-polygon tests to tell what kind of place I’m in, and smoothing out GPS jitter.',
  },
  {
    id: 'ml',
    label: 'Machine learning',
    group: 'ai',
    kind: 'topic',
    parent: 'ai',
    text: 'Machine learning methods I’ve implemented in Python, including a Random Forest that names a song’s mood.',
  },
  {
    id: 'sklearn',
    label: 'scikit-learn',
    group: 'ai',
    kind: 'topic',
    parent: 'ai',
    text: 'Trained and evaluated the song mood classifier’s Random Forest, then exported it to run in the browser.',
  },
  {
    id: 'pandas',
    label: 'pandas',
    group: 'ai',
    kind: 'topic',
    parent: 'ai',
    text: 'Loaded and cleaned 277,938 labelled songs for the song mood classifier.',
  },
  { id: 'claude', label: 'Claude', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day. I built RegionMusic with Claude Code.' },
  { id: 'chatgpt', label: 'ChatGPT', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'gemini', label: 'Gemini', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'hermes', label: 'Hermes', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'html', label: 'HTML', group: 'web', kind: 'topic', parent: 'web', text: 'The structure of a web page. Studied as part of the frontend.' },
  { id: 'js', label: 'JavaScript', group: 'web', kind: 'topic', parent: 'web', text: 'The language of the browser. Studied as part of the frontend.' },
  { id: 'ts', label: 'TypeScript', group: 'web', kind: 'topic', parent: 'web', text: 'JavaScript with types. Studied as part of the frontend.' },
  { id: 'react', label: 'React', group: 'web', kind: 'topic', parent: 'web', text: 'Components for building interfaces. Studied as part of the frontend, and used for Wemen and the song mood classifier.' },
  { id: 'tailwind', label: 'Tailwind CSS', group: 'web', kind: 'topic', parent: 'web', text: 'Utility-first styling. Studied as part of the frontend.' },
  { id: 'vite', label: 'Vite', group: 'web', kind: 'topic', parent: 'web', text: 'The build tool behind this site and the song mood classifier.' },
  {
    id: 'webaudio',
    label: 'Web Audio API',
    group: 'web',
    kind: 'topic',
    parent: 'web',
    text: 'Decoding songs and measuring their loudness and tempo in the browser, for the song mood classifier.',
  },
]

/** Nodes listed for each group in the accessible topic list. */
export function nodesForGroup(group: GroupId): TopicNode[] {
  if (group === 'all') return topicNodes.filter((n) => n.kind !== 'topic' || n.group === 'other')
  return topicNodes.filter((n) => n.group === group)
}
