import { describe, expect, it } from 'vitest'
import { topicNodes } from './content'
import { cameraFocus, distanceFor, edges, nodeById, placedNodes, terrainHeight } from './graph'

describe('graph layout', () => {
  it('places every node at a finite position', () => {
    expect(placedNodes).toHaveLength(topicNodes.length)
    for (const n of placedNodes) {
      expect(n.position.every(Number.isFinite)).toBe(true)
      expect(n.size).toBeGreaterThan(0)
    }
  })

  it('connects every non-root node to an existing parent', () => {
    expect(edges).toHaveLength(topicNodes.length - 1)
    for (const e of edges) {
      expect(nodeById(e.from)).toBeDefined()
      expect(nodeById(e.to)).toBeDefined()
    }
  })

  it('keeps satellites from overlapping each other', () => {
    for (let i = 0; i < placedNodes.length; i++) {
      for (let j = i + 1; j < placedNodes.length; j++) {
        const a = placedNodes[i].position
        const b = placedNodes[j].position
        const d = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2])
        expect(d, `${placedNodes[i].id} vs ${placedNodes[j].id}`).toBeGreaterThan(0.9)
      }
    }
  })
})

describe('camera fitting', () => {
  it('pulls back for narrower viewports so the whole group stays in frame', () => {
    for (const focus of Object.values(cameraFocus)) {
      expect(distanceFor(focus, 0.8)).toBeGreaterThan(distanceFor(focus, 1.6))
    }
  })

  it('tolerates degenerate aspect ratios', () => {
    expect(Number.isFinite(distanceFor(cameraFocus.all, 0))).toBe(true)
  })
})

describe('terrain', () => {
  it('is stepped into contour bands and stays below the nodes', () => {
    const lowestNode = Math.min(...placedNodes.map((n) => n.position[1]))
    for (const [x, z] of [[0, 0], [3.3, -2], [-8, 5], [12, -9]]) {
      const h = terrainHeight(x, z)
      expect(Math.abs(h / 0.16 - Math.round(h / 0.16))).toBeLessThan(1e-9)
      expect(h - 4.5).toBeLessThan(lowestNode)
    }
  })
})
