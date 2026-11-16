import { useState } from 'react'
import { sound } from '../sound'
import { tips } from './content'
import { LearnLayout } from './LearnLayout'

/**
 * Top tips as numbered cards. While presenting, each → / clicker press spotlights the next tip
 * (the others dim); after the last one, → moves on. Tapping a card spotlights it too.
 */
export default function TipsPage() {
  const [current, setCurrent] = useState<number | null>(null)

  const show = (i: number | null) => {
    sound.unlock()
    if (i !== null) sound.play('tick')
    setCurrent(i)
  }

  const next = () => {
    if (current === tips.length - 1) return false
    show(current === null ? 0 : current + 1)
    return true
  }

  const prev = () => {
    if (current === null) return false
    show(current === 0 ? null : current - 1)
    return true
  }

  return (
    <LearnLayout
      index={4}
      title="Top tips"
      subtitle="Things you can start doing now, whatever you want to be"
      onNext={next}
      onPrev={prev}
    >
      <ol className={`tips ${current !== null ? 'has-spotlight' : ''}`}>
        {tips.map((t, i) => (
          <li key={t.title} className={`tip ${current === i ? 'is-current' : ''}`}>
            <button className="tip__button" onClick={() => show(current === i ? null : i)} aria-pressed={current === i}>
              <span className="tip__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="tip__icon" aria-hidden="true">
                {t.icon}
              </span>
              <span className="tip__title">{t.title}</span>
              <span className="tip__text">{t.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </LearnLayout>
  )
}
