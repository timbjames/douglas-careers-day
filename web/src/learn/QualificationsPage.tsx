import { keepLearning, qualificationLevels, schoolOption, softSkills } from './content'
import { LearnLayout } from './LearnLayout'

export default function QualificationsPage() {
  // Highest level at the top, like climbing a ladder.
  const ladder = [...qualificationLevels].reverse()

  return (
    <LearnLayout
      index={2}
      title="Qualifications & training"
      subtitle="Every step on the ladder can lead to a tech job. You don’t have to climb all of them."
    >
      <div className="quals">
        <section className="ladder" aria-label="Qualifications by SCQF level">
          {ladder.map((l, i) => (
            <div key={l.scqf} className="ladder__rung" style={{ ['--rung' as string]: ladder.length - i }}>
              <span className="ladder__level">
                <small>SCQF</small>
                {l.scqf}
              </span>
              <span className="ladder__items">
                {l.items.map((item) => (
                  <span key={item} className="chip">
                    {item}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </section>

        <aside className="quals__side">
          <div className="callout">
            <h3>⭐ {schoolOption.title}</h3>
            <p>{schoolOption.text}</p>
          </div>

          <div className="panel-lite">
            <h3>Keep learning</h3>
            <ul className="tick-list">
              {keepLearning.map((k) => (
                <li key={k.title}>
                  <strong>{k.title}</strong> {k.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel-lite">
            <h3>Skills that matter just as much</h3>
            <div className="chips">
              {softSkills.map((s) => (
                <span key={s} className="chip chip--accent">
                  {s}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </LearnLayout>
  )
}
