import type { JSX } from 'react'
import { useEffect, useRef, useState } from 'react'

/**
 * The landing scene: a school corridor with a door at the end.
 *
 * Clicking the door opens it and walks you through to the directory. The
 * metaphor is the point of the whole project — the person who can help is
 * already on your corridor, behind a door you have never opened.
 */

/** Doors along the side walls: the neighbours you have not met. */
const NEIGHBOURS: { side: 'left' | 'right'; z: number }[] = [
  { side: 'left', z: 40 },
  { side: 'right', z: 130 },
  { side: 'left', z: 260 },
  { side: 'right', z: 370 }
]

/** Strip-lights down the ceiling. Nothing says institutional corridor faster. */
const CEILING_LIGHTS = [70, 220, 370, 500]

export function Hallway({ onEnter }: { onEnter: () => void }): JSX.Element {
  const [opening, setOpening] = useState(false)
  const timers = useRef<number[]>([])

  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach((t) => window.clearTimeout(t))
  }, [])

  const enter = (): void => {
    if (opening) return

    // Anyone who has asked the OS to reduce motion should not be walked down a
    // corridor; take them straight there.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onEnter()
      return
    }

    setOpening(true)
    // Matches the door swing plus the walk-through in hallway.css.
    timers.current.push(window.setTimeout(onEnter, 1500))
  }

  return (
    <div className="hall-stage">
      <div className={`hall-room${opening ? ' is-entering' : ''}`}>
        <div className="surface ceiling">
          {CEILING_LIGHTS.map((z) => (
            <span className="ceiling-light" key={z} style={{ top: `${z}px` }} aria-hidden="true" />
          ))}
        </div>
        <div className="surface floor" />

        {(['left', 'right'] as const).map((side) => (
          <div className={`surface wall wall-${side}`} key={side}>
            <div className="lockers" />
            {/* Doors belong to the wall, not the room: the wall is already
                rotated into place, so a child at `left: <z>` lands that far
                down the corridor without any transform of its own. */}
            {NEIGHBOURS.filter((n) => n.side === side).map((n) => (
              <div
                className="neighbour-door"
                key={n.z}
                style={{ left: `${n.z}px` }}
                aria-hidden="true"
              >
                <span className="neighbour-handle" />
              </div>
            ))}
          </div>
        ))}

        <div className="surface back-wall">
          {/* The lit opening revealed as the door swings away. */}
          <div className="doorway">
            <div className="doorway-light" />
          </div>

          <button
            type="button"
            className={`door${opening ? ' is-open' : ''}`}
            onClick={enter}
            aria-label="Open the door and enter the directory"
          >
            <span className="door-panel door-panel-top" aria-hidden="true" />
            <span className="door-window" aria-hidden="true" />
            <span className="door-panel door-panel-bottom" aria-hidden="true" />
            <span className="door-handle" aria-hidden="true" />

            <span className="sign" aria-hidden="true">
              <span className="sign-chain sign-chain-left" />
              <span className="sign-chain sign-chain-right" />
              <span className="sign-board">
                <span className="sign-title">Across the Hall</span>
                <span className="sign-sub">your neighbour may have an answer</span>
              </span>
            </span>
          </button>
        </div>
      </div>

      <p className={`hall-hint${opening ? ' is-hidden' : ''}`}>Click the door to go in</p>
    </div>
  )
}
