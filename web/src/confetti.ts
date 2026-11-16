import confetti from 'canvas-confetti'

/**
 * Confetti in the brand colours.
 *
 * Performance: it's drawn by a Web Worker on its own canvas (useWorker), so the game and the page
 * stay smooth while it falls. It's skipped for people who've asked their device to reduce motion.
 */

let fire: confetti.CreateTypes | null = null
let palette: string[] | null = null

function instance() {
  if (fire) return fire
  const canvas = document.createElement('canvas')
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '100',
  })
  document.body.appendChild(canvas)
  fire = confetti.create(canvas, { resize: true, useWorker: true, disableForReducedMotion: true })
  return fire
}

// Brand colours from the tokens in index.css, read once rather than on every burst.
function colours() {
  if (palette) return palette
  const css = getComputedStyle(document.documentElement)
  const pick = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
  palette = [pick('--accent', '#0ff2b2'), pick('--game', '#ffffff'), pick('--muted', '#a9adcf'), '#ffffff']
  return palette
}

/** A quick burst, e.g. when someone gets their ticket. */
export function burst() {
  void instance()({ particleCount: 100, spread: 80, origin: { y: 0.6 }, colors: colours() })
}

/** A bigger two-sided celebration, e.g. for raffle winners and top-3 scores. */
export function celebrate() {
  const shoot = instance()
  const colors = colours()
  const end = Date.now() + 2500
  // Fire from both sides ~20 times a second (not every frame): looks the same, far fewer particles.
  const id = setInterval(() => {
    void shoot({ particleCount: 10, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors })
    void shoot({ particleCount: 10, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors })
    if (Date.now() > end) clearInterval(id)
  }, 50)
}
