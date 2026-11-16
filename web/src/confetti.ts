import confetti from 'canvas-confetti'

const colours = ['#36e2a0', '#ff6bb5', '#6b8bff', '#ffd166', '#ffffff']

/** A quick burst, e.g. when someone gets their ticket. */
export function burst() {
  confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: colours })
}

/** A bigger two-sided celebration for raffle winners. */
export function celebrate() {
  const end = Date.now() + 2500
  const frame = () => {
    confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: colours })
    confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: colours })
    if (Date.now() < end) requestAnimationFrame(frame)
  }
  frame()
}
