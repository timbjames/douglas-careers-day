import { useState } from 'react'
import { sound } from '../sound'
import { sdlcStages } from './content'
import { LearnLayout } from './LearnLayout'

type Pt = [number, number]

/**
 * The figure-eight, as four cubic Bézier curves starting at the crossing point: up and round the
 * left loop ("build it"), back through the middle, then round the right loop ("run it").
 */
const SEGMENTS: [Pt, Pt, Pt, Pt][] = [
  [[500, 210], [400, 50], [130, 50], [130, 210]],
  [[130, 210], [130, 370], [400, 370], [500, 210]],
  [[500, 210], [600, 50], [870, 50], [870, 210]],
  [[870, 210], [870, 370], [600, 370], [500, 210]],
]

const PATH =
  `M${SEGMENTS[0][0].join(',')} ` +
  SEGMENTS.map(([, c1, c2, end]) => `C${c1.join(',')} ${c2.join(',')} ${end.join(',')}`).join(' ')

function bezier([p0, p1, p2, p3]: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t
  const f = (i: 0 | 1) => u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]
  return [f(0), f(1)]
}

/** Two stages on each curve, placed a quarter and three-quarters of the way along. */
const STAGE_POINTS: Pt[] = SEGMENTS.flatMap((seg) => [bezier(seg, 0.28), bezier(seg, 0.72)])

/**
 * The development lifecycle as an infinity loop. Tap a stage, or press → / a clicker to step
 * round the loop; after Monitor, → moves on to the next topic.
 */
export default function SdlcPage() {
  const [current, setCurrent] = useState(0)
  const stage = sdlcStages[current]

  const select = (i: number) => {
    sound.unlock()
    sound.play('tick')
    setCurrent(i)
  }

  return (
    <LearnLayout
      title="How software gets made"
      subtitle="Software is never “finished”: teams go round this loop again and again, often every day"
      onNext={() => (current < sdlcStages.length - 1 ? (select(current + 1), true) : false)}
      onPrev={() => (current > 0 ? (select(current - 1), true) : false)}
    >
      <div className="sdlc">
        <svg className="sdlc__loop" viewBox="0 0 1000 420" role="group" aria-label="Software development lifecycle">
          <defs>
            <linearGradient id="loopGradient" x1="0" x2="1">
              <stop offset="0" stopColor="var(--accent)" />
              <stop offset="1" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          <path d={PATH} className="sdlc__track" />
          <path d={PATH} className="sdlc__line" stroke="url(#loopGradient)" />
          <circle r="9" className="sdlc__runner">
            <animateMotion dur="10s" repeatCount="indefinite" path={PATH} />
          </circle>

          <text x="300" y="215" className="sdlc__side">
            BUILD IT
          </text>
          <text x="700" y="215" className="sdlc__side">
            RUN IT
          </text>

          {sdlcStages.map((s, i) => {
            const [x, y] = STAGE_POINTS[i]
            const active = i === current
            return (
              <g
                key={s.name}
                className={`sdlc__stage ${active ? 'is-active' : ''}`}
                transform={`translate(${x} ${y})`}
                onClick={() => select(i)}
                role="button"
                tabIndex={0}
                aria-pressed={active}
                aria-label={`${i + 1}. ${s.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') select(i)
                }}
              >
                <circle r={active ? 50 : 42} />
                <text y="-6" className="sdlc__icon">
                  {s.icon}
                </text>
                <text y="22" className="sdlc__name">
                  {s.name}
                </text>
              </g>
            )
          })}
        </svg>

        <section className="sdlc__panel" aria-live="polite">
          <div className="sdlc__panel-head">
            <span className="sdlc__step">
              {String(current + 1).padStart(2, '0')}/{String(sdlcStages.length).padStart(2, '0')}
            </span>
            <h2>
              {stage.icon} {stage.name}
            </h2>
          </div>
          <p className="sdlc__what">{stage.what}</p>
          <div className="tools">
            {stage.tools.map((t) => (
              <span key={t.name} className={`tool ${t.usedHere ? 'tool--here' : ''}`}>
                {t.name}
                {t.usedHere && <small>used to build this app</small>}
              </span>
            ))}
          </div>
        </section>
      </div>
    </LearnLayout>
  )
}
