import { myPathway, pathwayMessage, routes } from './content'
import { LearnLayout } from './LearnLayout'

export default function PathwayPage() {
  return (
    <LearnLayout title="Routes into tech" subtitle="There’s no single “right” way in: here are the main routes in Scotland">
      <div className="pathway">
        <section className="routes" aria-label="Routes into tech">
          <div className="routes__start">After S4–S6</div>
          {routes.map((r) => (
            <div key={r.name} className="route">
              <h3 className="route__name">{r.name}</h3>
              <ol className="route__steps">
                {r.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <p className="route__note">{r.note}</p>
            </div>
          ))}
          <div className="routes__end">A career in tech 🚀</div>
        </section>

        <section className="journey" aria-label="My pathway">
          <h2>My pathway</h2>
          <ol className="timeline">
            {myPathway.map((s) => (
              <li key={s.when + s.title} className={`timeline__step ${s.placeholder ? 'is-placeholder' : ''}`}>
                <span className="timeline__when">{s.when}</span>
                <span className="timeline__title">{s.title}</span>
                <span className="timeline__detail">{s.detail}</span>
              </li>
            ))}
          </ol>
          <p className="journey__message">{pathwayMessage}</p>
        </section>
      </div>
    </LearnLayout>
  )
}
