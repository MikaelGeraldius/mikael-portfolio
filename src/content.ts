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
  { area: 'Game development', topics: 'Unity, C#' },
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
    text: 'Games, studied with Unity and C#.',
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
  { id: 'react', label: 'React', group: 'web', kind: 'topic', parent: 'web', text: 'Components for building interfaces. Studied as part of the frontend.' },
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
