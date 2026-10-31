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
  { area: 'Frontend', topics: 'HTML, JavaScript, TypeScript, React, Tailwind CSS' },
  { area: 'Backend', topics: 'MySQL, PostgreSQL, ExpressJS' },
  { area: 'Mobile', topics: 'Kotlin, Room, React Native, Expo' },
  { area: 'UI design', topics: 'Visual hierarchy, spacing grids, colour systems and theming, icon design' },
  { area: 'Audio and playback', topics: 'Spotify Web API, background audio, audio processing in Python' },
  { area: 'Machine learning', topics: 'Methods implemented in Python' },
  { area: 'Game development', topics: 'Unity, C#' },
  { area: 'AI assistants', topics: 'Claude, Claude Code, ChatGPT, Gemini, Hermes' },
]

export interface Project {
  name: string
  meta: string
  summary: string
  does: string
  learned: string[]
  stack: string
  repo: string
  shots: { src: string; alt: string }[]
  shotsCaption: string
}

// Built Oct 2026; code public at the repo below. The music itself is Mikael's own
// files and is not in the repository, so the page names no soundtrack.
export const projects: Project[] = [
  {
    name: 'RegionMusic',
    meta: 'Personal project · 2026 · Android',
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
    // Captured from the app on Mikael's phone in its demo mode, so no real location history shows.
    shots: [
      { src: `${import.meta.env.BASE_URL}projects/regionmusic-playing.webp`, alt: 'RegionMusic playing a city theme at Summarecon Mall Serpong, with today’s tally and the journey list' },
      { src: `${import.meta.env.BASE_URL}projects/regionmusic-off.webp`, alt: 'RegionMusic with the music off and the pink Start music button' },
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
      'Machine learning methods I’ve implemented in Python, and the four AI assistants I use every day.',
  },
  {
    id: 'web',
    label: 'Web design',
    summary:
      'The frontend stack I’ve studied: HTML for structure, JavaScript and TypeScript for behaviour, React for components and Tailwind CSS for styling.',
  },
  {
    id: 'other',
    label: 'Also studied',
    summary: 'Backend, mobile and game development, studied alongside my two focus areas.',
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
    text: 'One of my two focus areas: machine learning in Python, and AI assistants I use every day.',
  },
  {
    id: 'web',
    label: 'Web design',
    group: 'web',
    kind: 'hub',
    parent: 'informatics',
    text: 'One of my two focus areas: the frontend, studied with HTML, JavaScript, TypeScript, React and Tailwind CSS.',
  },
  {
    id: 'backend',
    label: 'Backend',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Databases and servers, studied with MySQL, PostgreSQL and ExpressJS.',
  },
  {
    id: 'mobile',
    label: 'Mobile',
    group: 'other',
    kind: 'topic',
    parent: 'informatics',
    text: 'Android apps, studied with Kotlin and Room.',
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
    id: 'ml',
    label: 'Machine learning',
    group: 'ai',
    kind: 'topic',
    parent: 'ai',
    text: 'Machine learning methods I’ve implemented in Python as part of my studies.',
  },
  { id: 'claude', label: 'Claude', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'chatgpt', label: 'ChatGPT', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'gemini', label: 'Gemini', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'hermes', label: 'Hermes', group: 'ai', kind: 'topic', parent: 'ai', text: 'One of the AI assistants I use every day.' },
  { id: 'html', label: 'HTML', group: 'web', kind: 'topic', parent: 'web', text: 'The structure of a web page. Studied as part of the frontend.' },
  { id: 'js', label: 'JavaScript', group: 'web', kind: 'topic', parent: 'web', text: 'The language of the browser. Studied as part of the frontend.' },
  { id: 'ts', label: 'TypeScript', group: 'web', kind: 'topic', parent: 'web', text: 'JavaScript with types. Studied as part of the frontend.' },
  { id: 'react', label: 'React', group: 'web', kind: 'topic', parent: 'web', text: 'Components for building interfaces. Studied as part of the frontend.' },
  { id: 'tailwind', label: 'Tailwind CSS', group: 'web', kind: 'topic', parent: 'web', text: 'Utility-first styling. Studied as part of the frontend.' },
]

/** Nodes listed for each group in the accessible topic list. */
export function nodesForGroup(group: GroupId): TopicNode[] {
  if (group === 'all') return topicNodes.filter((n) => n.kind !== 'topic' || n.group === 'other')
  return topicNodes.filter((n) => n.group === group)
}
