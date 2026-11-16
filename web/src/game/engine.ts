/**
 * Bug Squash: a 30-second canvas game.
 * Bugs crawl across a code editor: tap them to squash them. Don't tap the ✨ features!
 *
 * The engine owns the canvas, game loop and input. React only renders the screens around it
 * and listens to the callbacks for the HUD and the final score.
 */

export type CritterKind = 'bug' | 'fast' | 'golden' | 'feature'

export interface Hud {
  score: number
  timeLeftMs: number
  combo: number
  multiplier: number
}

export interface RoundStats {
  score: number
  squashed: number
  features: number
  bestCombo: number
}

export interface EngineCallbacks {
  onHud: (hud: Hud) => void
  onEnd: (stats: RoundStats) => void
  /** Fired for every squash, e.g. to play a sound. */
  onSquash?: (kind: CritterKind) => void
}

interface Critter {
  kind: CritterKind
  x: number
  y: number
  heading: number // radians
  speed: number // px/s
  radius: number
  age: number // seconds
  turnRate: number // how much it wanders
  entered: boolean // has it been fully on screen yet?
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  ttl: number
  colour: string
  size: number
}

interface FloatingText {
  x: number
  y: number
  age: number
  ttl: number
  text: string
  colour: string
}

const POINTS: Record<CritterKind, number> = { bug: 10, fast: 20, golden: 50, feature: -20 }

const COLOURS: Record<Exclude<CritterKind, 'feature'>, string> = {
  bug: '#ff5c5c',
  fast: '#ffb347',
  golden: '#ffd166',
}

/** Reads a brand colour from the CSS tokens in index.css, with a fallback. */
function token(name: string, fallback: string) {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

export const ROUND_MS = 30_000

const rand = (min: number, max: number) => min + Math.random() * (max - min)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export class BugSquashEngine {
  private ctx: CanvasRenderingContext2D
  private width = 0
  private height = 0
  private scale = 1 // sizes and speeds scale with the screen
  private background: HTMLCanvasElement | null = null

  private critters: Critter[] = []
  private particles: Particle[] = []
  private texts: FloatingText[] = []

  private running = false
  private elapsedMs = 0
  private lastFrame = 0
  private nextSpawnMs = 0
  private rafId = 0

  private score = 0
  private combo = 0
  private bestCombo = 0
  private squashed = 0
  private featuresHit = 0

  private readonly canvas: HTMLCanvasElement
  private readonly callbacks: EngineCallbacks
  private readonly resizeObserver: ResizeObserver

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas
    this.callbacks = callbacks
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D is not supported')
    this.ctx = ctx

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(canvas)
    canvas.addEventListener('pointerdown', this.onPointerDown)
    this.resize()
    this.drawIdle()
  }

  /** Start a fresh round. */
  start() {
    this.critters = []
    this.particles = []
    this.texts = []
    this.elapsedMs = 0
    this.nextSpawnMs = 0
    this.score = 0
    this.combo = 0
    this.bestCombo = 0
    this.squashed = 0
    this.featuresHit = 0
    this.running = true
    this.lastFrame = performance.now()
    this.emitHud()
    cancelAnimationFrame(this.rafId)
    this.rafId = requestAnimationFrame(this.loop)
  }

  destroy() {
    this.running = false
    cancelAnimationFrame(this.rafId)
    this.resizeObserver.disconnect()
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
  }

  // ---------- Setup ----------

  private resize() {
    const rect = this.canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.width = rect.width
    this.height = rect.height
    // Never let bugs get too small to tap on a phone.
    this.scale = Math.max(0.9, Math.min(this.width, this.height) / 550)
    this.canvas.width = Math.round(rect.width * dpr)
    this.canvas.height = Math.round(rect.height * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.background = this.renderBackground(dpr)
    if (!this.running) this.drawIdle()
  }

  /** A fake code editor, drawn once per resize and reused every frame. */
  private renderBackground(dpr: number) {
    const bg = document.createElement('canvas')
    bg.width = this.canvas.width
    bg.height = this.canvas.height
    const g = bg.getContext('2d')!
    g.setTransform(dpr, 0, 0, dpr, 0, 0)

    const codeColours = [token('--accent', '#0ff2b2'), token('--game', '#4799b1'), token('--raffle', '#e53e33'), '#c3cbe8', token('--muted', '#a9adcf')]

    g.fillStyle = token('--surface-2', '#12153a')
    g.fillRect(0, 0, this.width, this.height)

    const lineHeight = 22
    const gutter = 44
    g.fillStyle = token('--surface', '#171b45')
    g.fillRect(0, 0, gutter, this.height)

    g.font = '12px ui-monospace, Menlo, monospace'
    g.textBaseline = 'middle'
    let indent = 0
    for (let i = 0, y = lineHeight; y < this.height; i++, y += lineHeight) {
      g.fillStyle = token('--border-strong', '#2f3573')
      g.fillText(String(i + 1).padStart(3, ' '), 8, y)

      if (Math.random() < 0.12) continue // blank line
      indent = Math.max(0, Math.min(4, indent + (Math.random() < 0.3 ? 1 : Math.random() < 0.3 ? -1 : 0)))
      let x = gutter + 14 + indent * 24
      const tokens = 1 + Math.floor(Math.random() * 5)
      for (let t = 0; t < tokens && x < this.width - 20; t++) {
        const w = rand(20, 110)
        g.fillStyle = codeColours[Math.floor(Math.random() * codeColours.length)]
        g.globalAlpha = 0.28
        g.beginPath()
        g.roundRect(x, y - 4, w, 8, 4)
        g.fill()
        x += w + 10
      }
      g.globalAlpha = 1
    }
    return bg
  }

  // ---------- Loop ----------

  private loop = (now: number) => {
    // Clamp the step so switching tabs doesn't make everything teleport (and pauses the clock).
    const dt = Math.min(now - this.lastFrame, 50)
    this.lastFrame = now

    if (this.running) {
      this.elapsedMs += dt
      this.spawn()
      this.update(dt / 1000)
      if (this.elapsedMs >= ROUND_MS) this.finish()
      else this.emitHud()
    } else {
      this.updateEffects(dt / 1000) // let the last splats finish
    }

    this.draw()
    if (this.running || this.particles.length > 0 || this.texts.length > 0) {
      this.rafId = requestAnimationFrame(this.loop)
    }
  }

  private finish() {
    this.running = false
    this.elapsedMs = ROUND_MS
    this.critters = []
    this.emitHud()
    this.callbacks.onEnd({
      score: this.score,
      squashed: this.squashed,
      features: this.featuresHit,
      bestCombo: this.bestCombo,
    })
  }

  private get progress() {
    return Math.min(1, this.elapsedMs / ROUND_MS)
  }

  private spawn() {
    if (this.elapsedMs < this.nextSpawnMs) return
    // Gets busier as the round goes on: one critter every ~0.9s at the start, ~0.3s at the end.
    this.nextSpawnMs = this.elapsedMs + lerp(900, 320, this.progress) * rand(0.6, 1.3)

    const roll = Math.random()
    const kind: CritterKind = roll < 0.18 ? 'feature' : roll < 0.23 ? 'golden' : roll < 0.45 ? 'fast' : 'bug'

    const baseSpeed = lerp(70, 150, this.progress) * this.scale
    const speed = baseSpeed * (kind === 'fast' ? 1.8 : kind === 'golden' ? 2.2 : kind === 'feature' ? 0.8 : 1)
    const radius = (kind === 'golden' ? 16 : kind === 'fast' ? 18 : 22) * this.scale

    // Enter from a random edge, heading roughly towards the middle.
    const edge = Math.floor(Math.random() * 4)
    const margin = radius * 2
    const x = edge === 0 ? -margin : edge === 1 ? this.width + margin : rand(0, this.width)
    const y = edge === 2 ? -margin : edge === 3 ? this.height + margin : rand(0, this.height)
    const targetX = rand(this.width * 0.25, this.width * 0.75)
    const targetY = rand(this.height * 0.25, this.height * 0.75)

    this.critters.push({
      kind,
      x,
      y,
      heading: Math.atan2(targetY - y, targetX - x),
      speed,
      radius,
      age: 0,
      turnRate: rand(0.5, 2.5) * (Math.random() < 0.5 ? -1 : 1),
      entered: false,
    })
  }

  private update(dt: number) {
    for (const c of this.critters) {
      c.age += dt
      // Wander: a slow wiggle on the heading so they don't move in straight lines.
      c.heading += Math.sin(c.age * c.turnRate * 2) * dt * 1.5
      c.x += Math.cos(c.heading) * c.speed * dt
      c.y += Math.sin(c.heading) * c.speed * dt

      const inside = c.x > c.radius && c.x < this.width - c.radius && c.y > c.radius && c.y < this.height - c.radius
      if (inside) c.entered = true
    }

    // Remove critters that have crawled off the screen (or got lost before ever arriving).
    const pad = 80 * this.scale
    this.critters = this.critters.filter((c) => {
      const off = c.x < -pad || c.x > this.width + pad || c.y < -pad || c.y > this.height + pad
      return !(off && (c.entered || c.age > 4))
    })

    this.updateEffects(dt)
  }

  private updateEffects(dt: number) {
    for (const p of this.particles) {
      p.age += dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.92
      p.vy *= 0.92
    }
    this.particles = this.particles.filter((p) => p.age < p.ttl)

    for (const t of this.texts) {
      t.age += dt
      t.y -= 40 * dt
    }
    this.texts = this.texts.filter((t) => t.age < t.ttl)
  }

  // ---------- Input ----------

  private onPointerDown = (e: PointerEvent) => {
    if (!this.running) return
    e.preventDefault()
    const rect = this.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Find the closest critter within a generous, finger-friendly radius.
    let hit: Critter | null = null
    let best = Infinity
    for (const c of this.critters) {
      const d = Math.hypot(c.x - x, c.y - y)
      if (d < c.radius * 1.6 + 6 && d < best) {
        best = d
        hit = c
      }
    }

    if (!hit) {
      this.combo = 0 // missing breaks your streak, but costs no points
      return
    }

    this.critters = this.critters.filter((c) => c !== hit)
    this.callbacks.onSquash?.(hit.kind)

    if (hit.kind === 'feature') {
      this.combo = 0
      this.featuresHit++
      this.score = Math.max(0, this.score + POINTS.feature)
      this.addText(hit.x, hit.y, "That's a feature! -20", '#6b8bff')
      this.splat(hit.x, hit.y, '#6b8bff', 10)
      return
    }

    this.combo++
    this.bestCombo = Math.max(this.bestCombo, this.combo)
    this.squashed++
    const multiplier = this.multiplier
    const points = POINTS[hit.kind] * multiplier
    this.score += points
    this.addText(hit.x, hit.y, multiplier > 1 ? `+${points} x${multiplier}` : `+${points}`, COLOURS[hit.kind])
    this.splat(hit.x, hit.y, COLOURS[hit.kind], hit.kind === 'golden' ? 26 : 14)
    this.emitHud()
  }

  /** Every 5 squashes in a row bumps the multiplier, up to x4. */
  private get multiplier() {
    return Math.min(4, 1 + Math.floor(this.combo / 5))
  }

  private lastHudKey = ''

  /** Only tells React about changes it can see (score, combo, tenths of a second), not every frame. */
  private emitHud() {
    const timeLeftMs = Math.max(0, ROUND_MS - this.elapsedMs)
    const key = `${this.score}|${this.combo}|${Math.ceil(timeLeftMs / 100)}`
    if (key === this.lastHudKey) return
    this.lastHudKey = key
    this.callbacks.onHud({ score: this.score, timeLeftMs, combo: this.combo, multiplier: this.multiplier })
  }

  private splat(x: number, y: number, colour: string, count: number) {
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2)
      const speed = rand(80, 260) * this.scale
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        age: 0,
        ttl: rand(0.35, 0.7),
        colour,
        size: rand(2, 5) * this.scale,
      })
    }
  }

  private addText(x: number, y: number, text: string, colour: string) {
    this.texts.push({ x, y, text, colour, age: 0, ttl: 0.9 })
  }

  // ---------- Drawing ----------

  private drawIdle() {
    this.draw()
  }

  private draw() {
    const g = this.ctx
    g.clearRect(0, 0, this.width, this.height)
    if (this.background) g.drawImage(this.background, 0, 0, this.width, this.height)

    for (const c of this.critters) {
      if (c.kind === 'feature') this.drawFeature(c)
      else this.drawBug(c)
    }

    for (const p of this.particles) {
      g.globalAlpha = 1 - p.age / p.ttl
      g.fillStyle = p.colour
      g.beginPath()
      g.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      g.fill()
    }
    g.globalAlpha = 1

    g.textAlign = 'center'
    g.textBaseline = 'middle'
    g.font = `800 ${Math.round(18 * this.scale)}px system-ui, sans-serif`
    for (const t of this.texts) {
      g.globalAlpha = 1 - t.age / t.ttl
      g.fillStyle = t.colour
      g.fillText(t.text, t.x, t.y)
    }
    g.globalAlpha = 1
  }

  private drawBug(c: Critter) {
    const g = this.ctx
    const r = c.radius
    const colour = COLOURS[c.kind as Exclude<CritterKind, 'feature'>]
    const legSwing = Math.sin(c.age * (c.kind === 'bug' ? 18 : 30)) * 0.35

    g.save()
    g.translate(c.x, c.y)
    g.rotate(c.heading)

    if (c.kind === 'golden') {
      g.shadowColor = colour
      g.shadowBlur = 20
    }

    // Legs: three each side, swinging alternately.
    g.strokeStyle = '#1a1a2e'
    g.lineWidth = Math.max(2, r * 0.12)
    g.lineCap = 'round'
    for (let i = -1; i <= 1; i++) {
      for (const side of [-1, 1]) {
        const swing = (i % 2 === 0 ? legSwing : -legSwing) * side
        const bx = i * r * 0.45
        g.beginPath()
        g.moveTo(bx, 0)
        g.lineTo(bx + Math.sin(swing) * r * 0.5, side * r * 0.95)
        g.stroke()
      }
    }

    // Body
    g.fillStyle = colour
    g.beginPath()
    g.ellipse(-r * 0.1, 0, r * 0.75, r * 0.58, 0, 0, Math.PI * 2)
    g.fill()
    g.shadowBlur = 0

    // Wing split and spots
    g.strokeStyle = 'rgb(0 0 0 / 0.35)'
    g.lineWidth = Math.max(1, r * 0.06)
    g.beginPath()
    g.moveTo(-r * 0.8, 0)
    g.lineTo(r * 0.45, 0)
    g.stroke()
    g.fillStyle = 'rgb(0 0 0 / 0.3)'
    for (const [sx, sy] of [
      [-0.35, -0.28],
      [-0.35, 0.28],
      [0.1, -0.22],
      [0.1, 0.22],
    ]) {
      g.beginPath()
      g.arc(sx * r, sy * r, r * 0.1, 0, Math.PI * 2)
      g.fill()
    }

    // Head, eyes and antennae
    g.fillStyle = '#1a1a2e'
    g.beginPath()
    g.arc(r * 0.68, 0, r * 0.3, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#fff'
    for (const side of [-1, 1]) {
      g.beginPath()
      g.arc(r * 0.8, side * r * 0.12, r * 0.08, 0, Math.PI * 2)
      g.fill()
    }
    g.strokeStyle = '#1a1a2e'
    g.lineWidth = Math.max(1.5, r * 0.07)
    for (const side of [-1, 1]) {
      g.beginPath()
      g.moveTo(r * 0.85, side * r * 0.15)
      g.quadraticCurveTo(r * 1.2, side * r * 0.2, r * 1.3, side * (r * 0.45 + legSwing * r * 0.2))
      g.stroke()
    }

    g.restore()
  }

  /** Features are shiny four-point sparkles with a label, so they read clearly as "not a bug". */
  private drawFeature(c: Critter) {
    const g = this.ctx
    const r = c.radius
    const pulse = 1 + Math.sin(c.age * 6) * 0.08

    g.save()
    g.translate(c.x, c.y)

    g.save()
    g.rotate(c.age * 1.5)
    g.scale(pulse, pulse)
    g.shadowColor = '#6be3ff'
    g.shadowBlur = 18
    const grad = g.createLinearGradient(-r, -r, r, r)
    grad.addColorStop(0, '#6be3ff')
    grad.addColorStop(1, '#6b8bff')
    g.fillStyle = grad
    g.beginPath()
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4
      const rr = i % 2 === 0 ? r : r * 0.35
      g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
    }
    g.closePath()
    g.fill()
    g.restore()

    g.font = `700 ${Math.round(11 * this.scale)}px ui-monospace, Menlo, monospace`
    g.textAlign = 'center'
    g.fillStyle = '#c3d3ff'
    g.fillText('feature', 0, r + 12 * this.scale)

    g.restore()
  }
}
