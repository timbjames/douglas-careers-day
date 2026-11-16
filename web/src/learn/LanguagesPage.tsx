import { useState } from 'react'
import { sound } from '../sound'
import { frameworkGroups, languages } from './content'
import { LearnLayout } from './LearnLayout'

/**
 * Programming languages (each with a one-line "Hello!") and frameworks grouped by what they build.
 * Presenter: → spotlights the languages, then each framework group in turn, then moves on.
 */
export default function LanguagesPage() {
  // null = nothing spotlighted; 0 = languages; 1..n = framework groups
  const [spot, setSpot] = useState<number | null>(null)
  const last = frameworkGroups.length

  const show = (i: number | null) => {
    sound.unlock()
    if (i !== null) sound.play('tick')
    setSpot(i)
  }

  const cls = (i: number) => (spot === null ? '' : spot === i ? 'is-spot' : 'is-dim')

  return (
    <LearnLayout
      title="Languages & frameworks"
      subtitle="Developers pick the right tool for the job: here are some of the most popular"
      onNext={() => (spot === last ? false : (show(spot === null ? 0 : spot + 1), true))}
      onPrev={() => (spot === null ? false : (show(spot === 0 ? null : spot - 1), true))}
    >
      <section className={`langs ${cls(0)}`} aria-label="Programming languages">
        <h2 className="langs__heading">💬 Languages: how to say “Hello!”</h2>
        <div className="langs__grid">
          {languages.map((l) => (
            <div key={l.name} className={`lang ${l.usedHere ? 'lang--here' : ''}`}>
              <div className="lang__head">
                <h3>{l.name}</h3>
                {l.usedHere && <span className="here-badge">in this app</span>}
              </div>
              <code className="lang__code">{l.hello}</code>
              <span className="lang__use">{l.use}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="frameworks" aria-label="Frameworks">
        {frameworkGroups.map((g, i) => (
          <div key={g.title} className={`fw ${cls(i + 1)}`}>
            <h3>
              {g.icon} {g.title}
            </h3>
            <div className="tools">
              {g.items.map((t) => (
                <span key={t.name} className={`tool ${t.usedHere ? 'tool--here' : ''}`}>
                  {t.name}
                  {t.usedHere && <small>in this app</small>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>
    </LearnLayout>
  )
}
