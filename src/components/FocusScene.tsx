import { useEffect, useRef } from 'react'
import type { GroupId } from '../content'
import { TopicMap } from '../topicMap'

interface Props {
  group: GroupId
  selectedId: string | null
  reducedMotion: boolean
  onSelect: (id: string | null) => void
  onFail: (reason: string) => void
}

const STEP = 0.12

export default function FocusScene({ group, selectedId, reducedMotion, onSelect, onFail }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const labelsRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<TopicMap | null>(null)
  // Latest props for the one-time scene setup below.
  const latest = useRef({ group, selectedId, reducedMotion, onSelect, onFail })
  latest.current = { group, selectedId, reducedMotion, onSelect, onFail }

  useEffect(() => {
    const stage = stageRef.current
    const labels = labelsRef.current
    if (!stage || !labels) return
    let map: TopicMap
    try {
      map = new TopicMap({
        container: stage,
        labelLayer: labels,
        reducedMotion: latest.current.reducedMotion,
        onSelect: (id) => latest.current.onSelect(id),
        onFail: (reason) => latest.current.onFail(reason),
      })
    } catch (error) {
      latest.current.onFail(error instanceof Error ? error.message : 'WebGL failed to start')
      return
    }
    mapRef.current = map
    map.setGroup(latest.current.group)
    map.setSelected(latest.current.selectedId)

    // Only animate while the map is on screen and the tab is visible.
    // Without a working IntersectionObserver the map simply stays active.
    let onScreen = true
    const sync = () => map.setActive(onScreen && !document.hidden)
    let io: IntersectionObserver | null = null
    try {
      io = new IntersectionObserver((entries) => {
        onScreen = entries.some((e) => e.isIntersecting)
        sync()
      })
      io.observe(stage)
    } catch {
      io = null
    }
    sync()
    document.addEventListener('visibilitychange', sync)

    return () => {
      io?.disconnect()
      document.removeEventListener('visibilitychange', sync)
      map.dispose()
      mapRef.current = null
    }
  }, [])

  useEffect(() => mapRef.current?.setGroup(group), [group])
  useEffect(() => mapRef.current?.setSelected(selectedId), [selectedId])
  useEffect(() => mapRef.current?.setReducedMotion(reducedMotion), [reducedMotion])

  const onKeyDown = (event: React.KeyboardEvent) => {
    const map = mapRef.current
    if (!map) return
    switch (event.key) {
      case 'ArrowLeft':
        map.rotate(STEP, 0)
        break
      case 'ArrowRight':
        map.rotate(-STEP, 0)
        break
      case 'ArrowUp':
        map.rotate(0, STEP * 0.6)
        break
      case 'ArrowDown':
        map.rotate(0, -STEP * 0.6)
        break
      case 'Home':
      case 'Escape':
        map.resetView()
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <div
      className="topic-map"
      role="group"
      aria-label="Interactive topic map"
      aria-describedby="topic-map-hint"
      tabIndex={0}
      onKeyDown={onKeyDown}
    >
      <div className="topic-map-stage" ref={stageRef} />
      <div className="topic-map-labels" ref={labelsRef} aria-hidden="true" />
      <p className="small topic-map-hint" id="topic-map-hint">
        Drag to turn the map, or use the arrow keys when it is focused. The topic list holds the same content.
      </p>
    </div>
  )
}
