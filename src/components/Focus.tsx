import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { groups, nodesForGroup, topicNodes, type GroupId } from '../content'
import { useNearViewport, useReducedMotion } from '../hooks'
import { webglAvailable } from '../webgl'

const FocusScene = lazy(() => import('./FocusScene'))

type SceneStatus = 'pending' | 'ready' | 'unavailable'

export default function Focus() {
  const reduced = useReducedMotion()
  const [group, setGroup] = useState<GroupId>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [home, setHome] = useState(0)
  const [status, setStatus] = useState<SceneStatus>('pending')
  const [stageRef, near] = useNearViewport<HTMLDivElement>()

  useEffect(() => {
    if (!webglAvailable()) setStatus('unavailable')
    else setStatus('ready')
  }, [])

  const chooseGroup = useCallback((next: GroupId) => {
    setGroup(next)
    setSelectedId(null)
  }, [])

  // Selecting from the 3D view (or the list) keeps the group in step with the node.
  const select = useCallback(
    (id: string | null) => {
      const node = id ? topicNodes.find((n) => n.id === id) : undefined
      // The degree is where the map starts: choosing it goes back to the overview, as the page first showed it.
      if (node?.kind === 'root') {
        chooseGroup('all')
        setHome((n) => n + 1)
        return
      }
      setSelectedId(id)
      if (!node) return
      const home: GroupId = node.group === 'root' ? 'all' : node.group
      if (group === 'all' ? node.kind === 'hub' : home !== group) setGroup(home)
    },
    [group, chooseGroup],
  )

  const current = groups.find((g) => g.id === group)!
  const selected = selectedId ? topicNodes.find((n) => n.id === selectedId) : undefined
  const list = nodesForGroup(group)

  return (
    <section className="focus" id="focus" data-tone="deep" aria-labelledby="focus-title">
      <div className="focus-grid">
        <div className="section-head focus-head">
          <h2 id="focus-title" className="reveal" data-reveal>
            AI and web design
          </h2>
          <p className="lead reveal" data-reveal>
            The two areas I want to work in. Pick one to see what I’ve studied around it.
          </p>
        </div>

        <fieldset className="picker reveal" data-reveal>
          <legend className="visually-hidden">Choose what to explore</legend>
          {groups.map((g) => (
            <label key={g.id}>
              <input
                type="radio"
                name="focus-group"
                value={g.id}
                checked={group === g.id}
                onChange={() => chooseGroup(g.id)}
              />
              <span>{g.label}</span>
            </label>
          ))}
        </fieldset>

        <div className="focus-stage reveal" data-reveal ref={stageRef}>
          {status === 'unavailable' ? (
            <p className="scene-fallback">
              The 3D map is not available in this browser, so the topic list shows everything it would. Nothing else on
              the page depends on it.
            </p>
          ) : near && status === 'ready' ? (
            <Suspense fallback={<div className="scene-loading" aria-hidden="true" />}>
              <FocusScene
                group={group}
                home={home}
                selectedId={selectedId}
                reducedMotion={reduced}
                onSelect={select}
                onFail={() => setStatus('unavailable')}
              />
            </Suspense>
          ) : (
            <div className="scene-loading" aria-hidden="true" />
          )}
        </div>

        <div className="focus-detail reveal" data-reveal>
          <p className="readout" aria-live="polite" aria-atomic="true">
            {selected ? (
              <>
                <strong>{selected.label}.</strong> {selected.text}
              </>
            ) : (
              current.summary
            )}
          </p>
          <div className="topics">
            <p className="small" aria-hidden="true">
              Topics
            </p>
            <ul className="topic-list" aria-label={`${current.label} topics`}>
              {list.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    aria-pressed={selectedId === node.id}
                    onClick={() => select(selectedId === node.id ? null : node.id)}
                  >
                    {node.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
