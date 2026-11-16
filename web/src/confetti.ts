import confetti from 'canvas-confetti'

// Confetti in the brand colours (from the tokens in index.css).
const colours = () => {
  const css = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  return [pick('--accent', '#0ff2b2'), pick('--game', '#4799b1'), pick('--raffle', '#e53e33'), '#ffffff']
}

/** A quick burst, e.g. when someone gets their ticket. */
export function burst() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: colours() })
}

/** A bigger two-sided celebration for raffle winners. */
export function celebrate() {
  const end = Date.now() + 2500
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: colours() })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: colours() })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
