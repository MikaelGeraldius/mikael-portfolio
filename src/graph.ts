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

// The degree in the middle, the two focus areas below it on either side with their topics on a ring, and
// the other studies fanned in an arc above the degree, so no edge has to cross a cluster.
const hubPosition: Record<string, Vec3> = {
  informatics: [0, 1.2, -0.6],
  ai: [-3.0, -0.6, 0],
  web: [3.0, -0.6, 0],
}

const ARC_RADIUS = 2.4

// Degrees around the degree node, left to right, with a little depth so the arc reads in 3D.
const otherArc: Record<string, [number, number]> = {
  backend: [160, 0.3],
  audio: [125, -0.1],
  mobile: [90, -0.4],
  location: [55, -0.1],
  game: [20, 0.3],
}

function onArc(id: string): Vec3 {
  const [degrees, z] = otherArc[id]
  const angle = (degrees * Math.PI) / 180
  const root = hubPosition.informatics
  return [root[0] + Math.cos(angle) * ARC_RADIUS, root[1] + Math.sin(angle) * ARC_RADIUS, z]
}

const RING_RADIUS = 1.95

// Angles (degrees) around each hub, in the order the topics are listed. The bottom stays open for the hub's
// label, and the direction of the edge back to the degree (about 31° for AI) is left clear; the rings mirror.
const ringAngles: Record<string, number[]> = {
  ai: [76, 113, 150, 187, 224, 316, 352],
  web: [104, 67, 30, -7, -44, 188, 224],
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
      position = onArc(node.id)
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
  all: { center: [0, 0.6, 0], halfWidth: 5.6, halfHeight: 3.6 },
  ai: { center: [hubPosition.ai[0] + 0.4, hubPosition.ai[1] - 0.1, 0], halfWidth: 3.8, halfHeight: 2.6 },
  web: { center: [hubPosition.web[0] - 0.4, hubPosition.web[1] - 0.1, 0], halfWidth: 3.8, halfHeight: 2.6 },
  other: { center: [0, 2.35, -0.2], halfWidth: 3.6, halfHeight: 1.9 },
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
