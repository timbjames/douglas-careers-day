import { subjects, subjectsTip } from './content'
import { LearnLayout } from './LearnLayout'

const labels = { 3: 'Really useful', 2: 'Very handy', 1: 'Helps too' } as const

export default function SubjectsPage() {
  return (
    <LearnLayout title="Useful school subjects" subtitle="What helps if you want to work in software development">
      <div className="subjects">
        {subjects.map((s) => (
          <div key={s.name} className={`subject subject--${s.relevance}`}>
            <div className="subject__head">
              <h3>{s.name}</h3>
              <span className="meter" aria-label={labels[s.relevance]}>
                {[1, 2, 3].map((n) => (
                  <span key={n} className={n <= s.relevance ? 'is-on' : ''} />
                ))}
              </span>
            </div>
            <p>{s.why}</p>
            <span className="subject__label">{labels[s.relevance]}</span>
          </div>
        ))}
      </div>
      <p className="learn__tip">💡 {subjectsTip}</p>
    </LearnLayout>
  )
}
