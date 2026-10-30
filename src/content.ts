// Single source of truth for every fact shown on the page.
// Only details confirmed by Mikael live here. There are no projects, employers,
// certificates, social profiles or CV, so none are listed.

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
  { area: 'Mobile', topics: 'Kotlin, Room' },
  { area: 'Machine learning', topics: 'Methods implemented in Python' },
  { area: 'Game development', topics: 'Unity, C#' },
  { area: 'AI assistants', topics: 'Claude, ChatGPT, Gemini, Hermes' },
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
