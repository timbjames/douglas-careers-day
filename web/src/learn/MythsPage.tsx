import { useState } from 'react'
import { sound } from '../sound'
import { myths } from './content'
import { LearnLayout } from './LearnLayout'

/**
 * Myth cards that flip to reveal the truth. Tap a card, or press → / a clicker to reveal them one
 * at a time while presenting; once all are revealed, → moves to the next topic.
 */
export default function MythsPage() {
  const [revealed, setRevealed] = useState<boolean[]>(() => myths.map(() => false))

  const flip = (i: number) => {
    sound.unlock()
    sound.play('tick')
    setRevealed((r) => r.map((v, j) => (j === i ? !v : v)))
  }

  const revealNext = () => {
    const i = revealed.indexOf(false)
    if (i === -1) return false
    flip(i)
    return true
  }

  const hideLast = () => {
    const i = revealed.lastIndexOf(true)
    if (i === -1) return false
    flip(i)
    return true
  }

  const count = revealed.filter(Boolean).length

  return (
    <LearnLayout
      title="Myths vs truths"
      subtitle={`Tap a card to bust the myth · ${count}/${myths.length} busted`}
      onNext={revealNext}
      onPrev={hideLast}
    >
      <div className="myths">
        {myths.map((m, i) => (
          <button
            key={m.myth}
            className={`myth ${revealed[i] ? 'is-revealed' : ''}`}
            onClick={() => flip(i)}
            aria-pressed={revealed[i]}
          >
            <span className="myth__inner">
              <span className="myth__face myth__front">
                <span className="myth__tag">Myth</span>
                <span className="myth__text">“{m.myth}”</span>
                <span className="myth__tap">Tap to reveal</span>
              </span>
              <span className="myth__face myth__back">
                <span className="myth__tag myth__tag--truth">✓ Truth</span>
                <span className="myth__text">{m.truth}</span>
              </span>
            </span>
          </button>
        ))}
      </div>
    </LearnLayout>
  )
}
