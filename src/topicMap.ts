import {
  AmbientLight,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  Group,
  IcosahedronGeometry,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshLambertMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three'
import type { GroupId } from './content'
import {
  cameraFocus,
  distanceFor,
  edges,
  isInGroup,
  nodeById,
  placedNodes,
  terrainHeight,
  type PlacedNode,
} from './graph'

// Palette of the dark chapters: FIELD is the Focus section's own background (the fog fades into it).
const FIELD = '#090b0e'
const TERRAIN_LOW = '#080a0d'
const TERRAIN_HIGH = '#151b25'
const EDGE_DIM = '#3b4556'
const INK = '#eef1f5'
const ACCENT = '#ff6b3d'
const DIM_NODE = '#5c6778'
const BASE_PITCH = 0.2
const MAX_YAW = 0.75
/** How far under a hub its label sits, in world units: just clear of the lowest topics on its ring. */
const HUB_CAPTION = 1.5

export interface TopicMapOptions {
  container: HTMLElement
  labelLayer: HTMLElement
  reducedMotion: boolean
  onSelect: (id: string | null) => void
  onFail: (reason: string) => void
}

interface NodeView {
  data: PlacedNode
  mesh: Mesh
  hit: Mesh
  material: MeshLambertMaterial
  label: HTMLElement
  scale: number
  scaleTarget: number
  color: Color
  colorTarget: Color
  /** The label's rendered width, measured once and again after a resize or a font load. */
  labelWidth: number
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

export class TopicMap {
  private readonly opts: TopicMapOptions
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(36, 1, 0.1, 80)
  private readonly rig = new Group()
  private readonly world = new Group()
  private readonly views: NodeView[] = []
  private readonly edgeGeometry = new BufferGeometry()
  private readonly raycaster = new Raycaster()
  private readonly ro: ResizeObserver
  private readonly disposables: { dispose(): void }[] = []
  private readonly tmp = new Vector3()

  private group: GroupId = 'all'
  private selectedId: string | null = null
  private hoveredId: string | null = null
  private reduced: boolean
  private active = false
  private frame = 0
  private lastTime = 0
  private disposed = false

  private width = 1
  private height = 1
  private center = new Vector3(...cameraFocus.all.center)
  private centerTarget = new Vector3(...cameraFocus.all.center)
  private distance = 12
  private distanceTarget = 12
  private yaw = 0
  private yawTarget = 0
  private pitch = BASE_PITCH
  private pitchTarget = BASE_PITCH
  private sway = 0
  private lastInput = -Infinity

  private pointerId: number | null = null
  private dragStart = { x: 0, y: 0 }
  private dragLast = { x: 0, y: 0 }
  private dragged = false

  constructor(opts: TopicMapOptions) {
    this.opts = opts
    this.reduced = opts.reducedMotion

    const coarse = window.matchMedia('(pointer: coarse)').matches
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    })
    if (!this.renderer.getContext()) throw new Error('WebGL context unavailable')
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 1.75))
    this.renderer.setClearColor(0x000000, 0)
    const canvas = this.renderer.domElement
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'topic-map-canvas'
    opts.container.appendChild(canvas)

    this.scene.fog = new Fog(new Color(FIELD), 15, 34)
    this.scene.add(new AmbientLight(0xffffff, 1.7))
    const sun = new DirectionalLight(0xfffbe8, 2.6)
    sun.position.set(5, 9, 7)
    this.scene.add(sun)

    this.scene.add(this.rig)
    this.rig.add(this.world)
    this.buildTerrain()
    this.buildEdges()
    this.buildNodes()

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(opts.container)
    this.resize()

    canvas.addEventListener('pointerdown', this.onPointerDown)
    canvas.addEventListener('pointermove', this.onPointerMove)
    canvas.addEventListener('pointerup', this.onPointerUp)
    canvas.addEventListener('pointercancel', this.onPointerCancel)
    canvas.addEventListener('pointerleave', this.onPointerLeave)
    canvas.addEventListener('webglcontextlost', this.onContextLost)
    canvas.addEventListener('webglcontextrestored', this.onContextRestored)

    this.applyGroupStyles(true)
    this.snapToTargets()
    this.render()
    // The label face may arrive after the map; once it has, the widths it was laid out with are stale.
    document.fonts?.ready.then(() => {
      if (!this.disposed) this.remeasureLabels()
    })
  }

  // ---- public API -------------------------------------------------------

  setGroup(group: GroupId) {
    this.group = group
    const focus = cameraFocus[group]
    this.centerTarget.set(...focus.center)
    this.distanceTarget = distanceFor(focus, this.width / this.height)
    this.yawTarget = 0
    this.pitchTarget = BASE_PITCH
    this.applyGroupStyles(this.reduced)
    this.kick()
  }

  setSelected(id: string | null) {
    this.selectedId = id
    this.applyGroupStyles(this.reduced)
    this.kick()
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced
    if (reduced) this.snapToTargets()
    this.kick()
  }

  /** Keyboard orbit. Steps are in radians. */
  rotate(dYaw: number, dPitch: number) {
    this.yawTarget = clamp(this.yawTarget + dYaw, -MAX_YAW, MAX_YAW)
    this.pitchTarget = clamp(this.pitchTarget + dPitch, 0.02, 0.62)
    this.noteInput()
    this.kick()
  }

  resetView() {
    this.yawTarget = 0
    this.pitchTarget = BASE_PITCH
    this.noteInput()
    this.kick()
  }

  setActive(active: boolean) {
    this.active = active
    if (active) this.kick()
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.ro.disconnect()
    const canvas = this.renderer.domElement
    canvas.removeEventListener('pointerdown', this.onPointerDown)
    canvas.removeEventListener('pointermove', this.onPointerMove)
    canvas.removeEventListener('pointerup', this.onPointerUp)
    canvas.removeEventListener('pointercancel', this.onPointerCancel)
    canvas.removeEventListener('pointerleave', this.onPointerLeave)
    canvas.removeEventListener('webglcontextlost', this.onContextLost)
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored)
    for (const d of this.disposables) d.dispose()
    this.edgeGeometry.dispose()
    this.renderer.dispose()
    this.renderer.forceContextLoss()
    canvas.remove()
    for (const v of this.views) v.label.remove()
  }

  // ---- scene construction ----------------------------------------------

  private buildTerrain() {
    const w = 96
    const d = 72
    const segX = 48
    const segZ = 36
    const plane = new PlaneGeometry(w, d, segX, segZ)
    plane.rotateX(-Math.PI / 2)
    const pos = plane.attributes.position as BufferAttribute
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)))
    }
    const geo = plane.toNonIndexed()
    plane.dispose()
    geo.computeVertexNormals()

    // Colour every facet by its height so the stepped surface reads as contour bands.
    const p = geo.attributes.position as BufferAttribute
    const colours = new Float32Array(p.count * 3)
    const low = new Color(TERRAIN_LOW)
    const high = new Color(TERRAIN_HIGH)
    // Lit facets come out about 15% brighter than their vertex colour, so aim a little under the field.
    const field = new Color(FIELD).multiplyScalar(0.86)
    const c = new Color()
    for (let i = 0; i < p.count; i += 3) {
      const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3
      const t = clamp((y + 1.3) / 2.6, 0, 1)
      c.copy(low).lerp(high, t * 0.85)
      // Dissolve into the field colour towards the sides and the near edge so the relief has no box edge.
      const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3
      const cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3
      const side = clamp((Math.abs(cx) - 3) / 5, 0, 1)
      const near = clamp((cz - 3) / 5, 0, 1)
      const fade = Math.max(side, near)
      c.lerp(field, fade * fade * (3 - 2 * fade))
      for (let k = 0; k < 3; k++) c.toArray(colours, (i + k) * 3)
    }
    geo.setAttribute('color', new Float32BufferAttribute(colours, 3))

    const mat = new MeshLambertMaterial({ vertexColors: true, flatShading: true })
    const mesh = new Mesh(geo, mat)
    mesh.position.set(0, -4.5, -2)
    this.world.add(mesh)
    this.disposables.push(geo, mat)
  }

  private buildEdges() {
    const positions = new Float32Array(edges.length * 6)
    const colours = new Float32Array(edges.length * 6)
    edges.forEach((e, i) => {
      const a = nodeById(e.from)!.position
      const b = nodeById(e.to)!.position
      positions.set(a, i * 6)
      positions.set(b, i * 6 + 3)
    })
    this.edgeGeometry.setAttribute('position', new BufferAttribute(positions, 3))
    this.edgeGeometry.setAttribute('color', new BufferAttribute(colours, 3))
    const mat = new LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.9 })
    this.world.add(new LineSegments(this.edgeGeometry, mat))
    this.disposables.push(mat)
  }

  private buildNodes() {
    const geo = new IcosahedronGeometry(1, 0)
    this.disposables.push(geo)
    const hitMaterial = new MeshLambertMaterial()
    this.disposables.push(hitMaterial)
    for (const data of placedNodes) {
      const material = new MeshLambertMaterial({ color: INK, flatShading: true })
      this.disposables.push(material)
      const mesh = new Mesh(geo, material)
      mesh.position.set(...data.position)
      mesh.scale.setScalar(data.size)
      mesh.rotation.set(data.size * 3, data.position[0], 0.3)
      this.world.add(mesh)

      // A larger invisible sphere is the touch target; it is never drawn.
      const hit = new Mesh(geo, hitMaterial)
      hit.visible = false
      hit.position.copy(mesh.position)
      hit.scale.setScalar(Math.max(data.size * 1.9, 0.75))
      hit.userData.id = data.id
      this.world.add(hit)

      const label = document.createElement('span')
      label.className = 'topic-map-label'
      label.dataset.kind = data.kind
      label.textContent = data.label
      this.opts.labelLayer.appendChild(label)

      this.views.push({
        data,
        mesh,
        hit,
        material,
        label,
        scale: 1,
        scaleTarget: 1,
        color: new Color(INK),
        colorTarget: new Color(INK),
        labelWidth: 0,
      })
    }
  }

  // ---- state styling ----------------------------------------------------

  private applyGroupStyles(snap: boolean) {
    const colours = this.edgeGeometry.attributes.color as BufferAttribute
    const lit = new Color(INK)
    const dim = new Color(EDGE_DIM)
    edges.forEach((e, i) => {
      const a = nodeById(e.from)!
      const b = nodeById(e.to)!
      const on = isInGroup(a, this.group) && isInGroup(b, this.group)
      const col = on ? lit : dim
      colours.setXYZ(i * 2, col.r, col.g, col.b)
      colours.setXYZ(i * 2 + 1, col.r, col.g, col.b)
    })
    colours.needsUpdate = true

    for (const v of this.views) {
      const inGroup = isInGroup(v.data, this.group) || v.data.kind !== 'topic'
      const emphasised = isInGroup(v.data, this.group)
      // The two focus areas (and the degree they grow from) take the accent; everything else is ink.
      v.colorTarget.set(emphasised ? (v.data.kind === 'topic' ? INK : ACCENT) : DIM_NODE)
      const selected = v.data.id === this.selectedId
      v.scaleTarget = selected ? 1.4 : v.data.id === this.hoveredId ? 1.18 : inGroup ? 1 : 0.8
      if (snap) {
        v.scale = v.scaleTarget
        v.color.copy(v.colorTarget)
      }
      v.label.classList.toggle('is-selected', selected)
      const showLabel =
        selected ||
        v.data.id === this.hoveredId ||
        v.data.kind !== 'topic' ||
        (this.group === 'all' ? v.data.group === 'other' : v.data.group === this.group)
      v.label.classList.toggle('is-hidden', !showLabel)
      v.label.classList.toggle('is-dim', !emphasised)
    }
  }

  // ---- animation --------------------------------------------------------

  private snapToTargets() {
    this.center.copy(this.centerTarget)
    this.distance = this.distanceTarget
    this.yaw = this.yawTarget
    this.pitch = this.pitchTarget
    for (const v of this.views) {
      v.scale = v.scaleTarget
      v.color.copy(v.colorTarget)
    }
  }

  private noteInput() {
    this.lastInput = performance.now()
  }

  private kick() {
    if (this.disposed) return
    if (this.reduced) {
      this.snapToTargets()
      this.render()
      return
    }
    if (!this.frame && this.active) this.frame = requestAnimationFrame(this.tick)
    if (!this.active) this.render()
  }

  private tick = (now: number) => {
    this.frame = 0
    if (this.disposed) return
    const dt = Math.min(0.05, this.lastTime ? (now - this.lastTime) / 1000 : 0.016)
    this.lastTime = now
    const ease = 1 - Math.exp(-dt * 7)

    this.center.lerp(this.centerTarget, ease)
    this.distance += (this.distanceTarget - this.distance) * ease
    this.yaw += (this.yawTarget - this.yaw) * ease
    this.pitch += (this.pitchTarget - this.pitch) * ease
    let moving =
      this.center.distanceToSquared(this.centerTarget) > 1e-5 ||
      Math.abs(this.distanceTarget - this.distance) > 1e-3 ||
      Math.abs(this.yawTarget - this.yaw) > 1e-3 ||
      Math.abs(this.pitchTarget - this.pitch) > 1e-3

    for (const v of this.views) {
      v.scale += (v.scaleTarget - v.scale) * ease
      v.color.lerp(v.colorTarget, ease)
      if (Math.abs(v.scaleTarget - v.scale) > 1e-3) moving = true
    }

    // A slow sway keeps the map alive; it pauses after the visitor touches it.
    const idle = now - this.lastInput > 4000 && this.pointerId === null
    this.sway = idle ? Math.sin(now / 3200) * 0.09 : this.sway * (1 - ease)

    this.render()
    if (this.active && (moving || idle || Math.abs(this.sway) > 1e-3)) {
      this.frame = requestAnimationFrame(this.tick)
    } else {
      this.lastTime = 0
    }
  }

  private render() {
    if (this.disposed) return
    this.rig.rotation.set(this.pitch, this.yaw + this.sway, 0)
    this.world.position.copy(this.center).multiplyScalar(-1)
    this.camera.position.set(0, 0, this.distance)
    this.camera.lookAt(0, 0, 0)
    const fog = this.scene.fog as Fog
    fog.near = this.distance + 1.5
    fog.far = this.distance + 14
    for (const v of this.views) {
      v.mesh.scale.setScalar(v.data.size * v.scale)
      v.material.color.copy(v.color)
    }
    this.renderer.render(this.scene, this.camera)
    this.placeLabels()
  }

  private toScreen(v: NodeView): [number, number] {
    this.tmp.copy(v.mesh.position)
    v.mesh.parent!.localToWorld(this.tmp)
    this.tmp.project(this.camera)
    return [(this.tmp.x * 0.5 + 0.5) * this.width, (-this.tmp.y * 0.5 + 0.5) * this.height]
  }

  /**
   * A topic's label sits outward from its parent, on the far side of the node, so the labels around a ring
   * fan out instead of stacking under each other. A hub's label sits under its ring, as the cluster's caption;
   * the degree's label sits under its node.
   */
  private placeLabels() {
    const pxPerUnit = this.height / (2 * this.distance * Math.tan((this.camera.fov * Math.PI) / 360))
    const screen = new Map(this.views.map((v) => [v.data.id, this.toScreen(v)]))
    // Measure before moving anything, so reading widths never forces a layout between writes.
    for (const v of this.views) if (!v.labelWidth) v.labelWidth = v.label.offsetWidth
    for (const v of this.views) {
      const [x, y] = screen.get(v.data.id)!
      const radius = v.data.size * v.scale * pxPerUnit
      // Where the label's anchor point sits, and how far across and down the label that point is (0 to 1).
      let ax = x
      let ay = y
      let fx = 0.5
      let fy = 0
      if (v.data.kind === 'topic' && v.data.parent) {
        const [px, py] = screen.get(v.data.parent)!
        const len = Math.hypot(x - px, y - py) || 1
        const ux = (x - px) / len
        const uy = (y - py) / len
        const gap = radius + 8
        ax = x + ux * gap
        ay = y + uy * gap
        fx = 0.5 - 0.5 * ux
        fy = 0.5 - 0.5 * uy
      } else {
        ay = y + (v.data.kind === 'hub' ? HUB_CAPTION * pxPerUnit : 10 + radius)
      }
      // Labels at the edge of a narrow map slide inward rather than being cut off.
      const left = clamp(ax - fx * v.labelWidth, 4, Math.max(4, this.width - v.labelWidth - 4))
      v.label.style.transform = `translate3d(${left.toFixed(1)}px, ${ay.toFixed(1)}px, 0) translateY(${(-fy * 100).toFixed(1)}%)`
    }
  }

  private resize() {
    const rect = this.opts.container.getBoundingClientRect()
    this.width = Math.max(1, Math.round(rect.width))
    this.height = Math.max(1, Math.round(rect.height))
    this.renderer.setSize(this.width, this.height, false)
    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()
    this.distanceTarget = distanceFor(cameraFocus[this.group], this.camera.aspect)
    this.distance = this.distanceTarget
    this.remeasureLabels()
  }

  /** Label widths change with the font and the layout; measure them again on the next frame drawn. */
  private remeasureLabels() {
    for (const v of this.views) v.labelWidth = 0
    this.render()
  }

  // ---- pointer ----------------------------------------------------------

  private pick(clientX: number, clientY: number): string | null {
    const rect = this.renderer.domElement.getBoundingClientRect()
    const ndc = new Vector2(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    )
    this.raycaster.setFromCamera(ndc, this.camera)
    const hits = this.raycaster.intersectObjects(
      this.views.map((v) => v.hit),
      false,
    )
    return hits.length ? (hits[0].object.userData.id as string) : null
  }

  private onPointerDown = (e: PointerEvent) => {
    if (this.pointerId !== null) return
    this.pointerId = e.pointerId
    this.dragStart = { x: e.clientX, y: e.clientY }
    this.dragLast = { x: e.clientX, y: e.clientY }
    this.dragged = false
    this.renderer.domElement.setPointerCapture(e.pointerId)
    this.noteInput()
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.pointerId === null) {
      if (e.pointerType === 'mouse') this.setHover(this.pick(e.clientX, e.clientY))
      return
    }
    if (e.pointerId !== this.pointerId) return
    const dx = e.clientX - this.dragLast.x
    const dy = e.clientY - this.dragLast.y
    this.dragLast = { x: e.clientX, y: e.clientY }
    if (Math.hypot(e.clientX - this.dragStart.x, e.clientY - this.dragStart.y) > 6) this.dragged = true
    if (!this.dragged) return
    this.yawTarget = clamp(this.yawTarget + dx * 0.006, -MAX_YAW, MAX_YAW)
    if (e.pointerType !== 'touch') this.pitchTarget = clamp(this.pitchTarget + dy * 0.004, 0.02, 0.62)
    this.noteInput()
    this.kick()
  }

  private onPointerUp = (e: PointerEvent) => {
    if (e.pointerId !== this.pointerId) return
    this.pointerId = null
    if (this.renderer.domElement.hasPointerCapture(e.pointerId)) {
      this.renderer.domElement.releasePointerCapture(e.pointerId)
    }
    if (!this.dragged) {
      const id = this.pick(e.clientX, e.clientY)
      this.opts.onSelect(id === this.selectedId ? null : id)
    }
    this.noteInput()
    this.kick()
  }

  private onPointerCancel = (e: PointerEvent) => {
    if (e.pointerId === this.pointerId) this.pointerId = null
  }

  private onPointerLeave = () => this.setHover(null)

  private setHover(id: string | null) {
    if (id === this.hoveredId) return
    this.hoveredId = id
    this.renderer.domElement.style.cursor = id ? 'pointer' : ''
    this.applyGroupStyles(this.reduced)
    this.kick()
  }

  private onContextLost = (e: Event) => {
    e.preventDefault()
    this.opts.onFail('WebGL context lost')
  }

  private onContextRestored = () => this.kick()
}
