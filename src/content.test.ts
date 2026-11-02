import { describe, expect, it } from 'vitest'
import { contact, facts, groups, mailtoHref, nodesForGroup, person, projects, studied, topicNodes } from './content'

describe('confirmed facts', () => {
  it('keeps the user-approved identity and timeline', () => {
    expect(person.name).toBe('Mikael Geraldius Gunawan')
    expect(`${person.firstLine} ${person.secondLine}`).toBe(person.name)
    expect(person.university).toBe('Universitas Multimedia Nusantara')
    expect(facts.map((f) => f.value)).toEqual(['2024', '5', '2028'])
  })

  it('links the requested email and publishes no phone number', () => {
    expect(mailtoHref.startsWith('mailto:ops.gege.lie@gmail.com?subject=')).toBe(true)
    expect(Object.keys(contact)).toEqual(['email', 'emailSubject'])
  })

  it('lists every studied area and AI assistant from the brief', () => {
    const text = studied.map((s) => `${s.area} ${s.topics}`).join(' ')
    for (const word of ['HTML', 'JavaScript', 'TypeScript', 'React', 'Tailwind', 'MySQL', 'PostgreSQL', 'ExpressJS', 'Kotlin', 'Room', 'React Native', 'Expo', 'Python', 'Unity', 'C#', 'Claude', 'ChatGPT', 'Gemini', 'Hermes']) {
      expect(text).toContain(word)
    }
  })

  it('shows only the confirmed projects, linked to their real repositories', () => {
    expect(projects.map((p) => p.name)).toEqual(['Song mood classifier', 'ReLa', 'RegionMusic', 'Wemen'])
    expect(projects.map((p) => p.repo)).toEqual([
      'https://github.com/MikaelGeraldius/mood-classifier',
      'https://github.com/AltoDevv/rela-submission',
      'https://github.com/MikaelGeraldius/RegionMusic',
      'https://github.com/MikaelGeraldius/UAS-WEMEN',
    ])
    expect(new Set(projects.map((p) => p.slug)).size).toBe(projects.length)
    for (const p of projects) {
      expect(p.learned.length).toBeGreaterThan(0)
      expect(p.shots.length).toBeGreaterThan(0)
    }
  })

  it('invents no other projects, employers or profiles', () => {
    const all = JSON.stringify({ studied, topicNodes, groups })
    expect(all).not.toMatch(/project|intern at|certificate|github\.com|linkedin/i)
  })
})

describe('topic map data', () => {
  it('has unique ids and parents that exist', () => {
    const ids = topicNodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const node of topicNodes) if (node.parent) expect(ids).toContain(node.parent)
  })

  it('lists the nodes of each group for the accessible list', () => {
    expect(nodesForGroup('all').map((n) => n.id)).toEqual([
      'informatics',
      'ai',
      'web',
      'backend',
      'mobile',
      'game',
      'audio',
      'location',
    ])
    expect(nodesForGroup('ai').map((n) => n.id)).toEqual([
      'ai',
      'ml',
      'sklearn',
      'pandas',
      'claude',
      'chatgpt',
      'gemini',
      'hermes',
    ])
    expect(nodesForGroup('web').map((n) => n.id)).toEqual([
      'web',
      'html',
      'js',
      'ts',
      'react',
      'tailwind',
      'vite',
      'webaudio',
    ])
    expect(nodesForGroup('other')).toHaveLength(5)
  })

  it('describes each exploration group', () => {
    expect(groups.map((g) => g.id)).toEqual(['all', 'ai', 'web', 'other'])
    for (const g of groups) expect(g.summary.length).toBeGreaterThan(20)
  })
})
