import { topicNodes, type GroupId, type TopicNode } from './content'

export type Vec3 = [number, number, number]

export interface PlacedNode extends TopicNode {
  position: Vec3
  /** Radius of the low-poly node in world units. */
  size: number
}

export interface Edge {
  from: string
  to: string
}

export interface CameraFocus {
  center: Vec3
  /** Half of the width and height, in world units, that the view must contain. */
  halfWidth: number
  halfHeight: number
}

// A top-down tree: the degree on top, the two focus areas below it with their
// topics on a ring, and the other studies along the bottom.
const hubPosition: Record<string, Vec3> = {
  informatics: [0, 2.3, -0.8],
  ai: [-2.8, 0.45, 0],
  web: [2.8, 0.45, 0],
}

const otherPosition: Record<string, Vec3> = {
  backend: [-2.4, -2.0, 0.9],
  mobile: [0, -2.95, 1.3],
  game: [2.4, -2.0, 0.9],
}

const RING_RADIUS = 1.8

// Angles (degrees) around each hub. The bottom stays open for the hub's label and
// the direction of the edge back to the degree is left clear.
const ringAngles: Record<string, number[]> = {
  ai: [95, 140, 185, 230, 325],
  web: [85, 40, -5, -50, 215],
}

/** Satellite position on a ring around a hub, deterministic. */
function ringAround(hub: Vec3, hubId: string, index: number): Vec3 {
  const angle = (ringAngles[hubId][index] * Math.PI) / 180
  const phase = hubId === 'ai' ? 0.9 : 2.2
  return [
    hub[0] + Math.cos(angle) * RING_RADIUS,
    hub[1] + Math.sin(angle) * RING_RADIUS * 0.82,
    hub[2] + Math.sin(angle * 2 + phase) * 0.7,
  ]
}

function build(): PlacedNode[] {
  const counters: Record<string, number> = { ai: 0, web: 0 }
  return topicNodes.map((node) => {
    let position: Vec3
    if (node.kind === 'root' || node.kind === 'hub') {
      position = hubPosition[node.id]
    } else if (node.parent === 'ai' || node.parent === 'web') {
      const hub = hubPosition[node.parent]
      position = ringAround(hub, node.parent, counters[node.parent]++)
    } else {
      position = otherPosition[node.id]
    }
    const size = node.kind === 'root' ? 0.5 : node.kind === 'hub' ? 0.62 : 0.3
    return { ...node, position, size }
  })
}

export const placedNodes: PlacedNode[] = build()

export const edges: Edge[] = topicNodes
  .filter((n): n is TopicNode & { parent: string } => Boolean(n.parent))
  .map((n) => ({ from: n.parent, to: n.id }))

export function nodeById(id: string): PlacedNode | undefined {
  return placedNodes.find((n) => n.id === id)
}

/** Whether a node is emphasised when a group is chosen. */
export function isInGroup(node: TopicNode, group: GroupId): boolean {
  if (group === 'all') return true
  return node.group === group
}

export const cameraFocus: Record<GroupId, CameraFocus> = {
  all: { center: [0, -0.2, 0.2], halfWidth: 5.3, halfHeight: 4.2 },
  ai: { center: [hubPosition.ai[0] + 0.5, hubPosition.ai[1] - 0.1, 0], halfWidth: 3.6, halfHeight: 2.6 },
  web: { center: [hubPosition.web[0] - 0.5, hubPosition.web[1] - 0.1, 0], halfWidth: 3.6, halfHeight: 2.6 },
  other: { center: [0, -2.4, 1.1], halfWidth: 3.7, halfHeight: 1.9 },
}

const TAN_HALF_FOV = Math.tan((36 * Math.PI) / 360)

/** Camera distance at which a group's extents fit the viewport, whatever its shape. */
export function distanceFor(focus: CameraFocus, aspect: number): number {
  const byWidth = focus.halfWidth / (Math.max(aspect, 0.3) * TAN_HALF_FOV)
  const byHeight = focus.halfHeight / TAN_HALF_FOV
  return Math.max(byWidth, byHeight)
}

/** Gentle terraced terrain height: layered sines, stepped into contour bands. */
export function terrainHeight(x: number, z: number): number {
  const raw =
    Math.sin(x * 0.42 + 1.3) * 0.55 +
    Math.cos(z * 0.5 - 0.4) * 0.5 +
    Math.sin((x + z) * 0.21) * 0.7 +
    Math.cos(x * 0.13 - z * 0.17) * 0.6
  const step = 0.16
  return Math.round((raw * 0.55) / step) * step
}
