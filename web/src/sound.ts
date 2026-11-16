import { useSyncExternalStore } from 'react'

/**
 * Tiny synthesised sound effects (no audio files to ship). Browsers only allow audio after the
 * user has interacted with the page, so call `sound.unlock()` from a click/tap handler first.
 */

export type SoundName =
  | 'squash'
  | 'squashFast'
  | 'golden'
  | 'feature'
  | 'tick'
  | 'countdown'
  | 'go'
  | 'gameOver'
  | 'ticket'
  | 'fanfare'

const MUTE_KEY = 'careersday.muted'

let ctx: AudioContext | null = null
let master: GainNode | null = null
let muted = (() => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
})()
const listeners = new Set<() => void>()

function audio() {
  if (ctx) return ctx
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = 0.8
  master.connect(ctx.destination)
  return ctx
}

interface ToneOptions {
  freq: number
  to?: number
  type?: OscillatorType
  at?: number
  dur?: number
  vol?: number
}

function tone(c: AudioContext, { freq, to, type = 'sine', at = 0, dur = 0.15, vol = 0.2 }: ToneOptions) {
  const t = c.currentTime + at
  const osc = c.createOscillator()
  const gain = c.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + dur)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(master!)
  osc.start(t)
  osc.stop(t + dur + 0.05)
}

function noise(c: AudioContext, { at = 0, dur = 0.08, vol = 0.25, cutoff = 1500 } = {}) {
  const t = c.currentTime + at
  const buffer = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  const src = c.createBufferSource()
  src.buffer = buffer
  const filter = c.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  const gain = c.createGain()
  gain.gain.setValueAtTime(vol, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(filter).connect(gain).connect(master!)
  src.start(t)
}

const sounds: Record<SoundName, (c: AudioContext) => void> = {
  squash: (c) => {
    noise(c, { dur: 0.07, vol: 0.3 })
    tone(c, { freq: 320, to: 70, type: 'square', dur: 0.1, vol: 0.12 })
  },
  squashFast: (c) => {
    noise(c, { dur: 0.06, vol: 0.25, cutoff: 2500 })
    tone(c, { freq: 600, to: 140, type: 'square', dur: 0.09, vol: 0.1 })
  },
  golden: (c) => {
    noise(c, { dur: 0.05, vol: 0.2 })
    ;[880, 1175, 1568, 2093].forEach((f, i) => tone(c, { freq: f, type: 'triangle', at: i * 0.05, dur: 0.18, vol: 0.15 }))
  },
  feature: (c) => {
    tone(c, { freq: 180, to: 90, type: 'sawtooth', dur: 0.35, vol: 0.12 })
    tone(c, { freq: 185, to: 92, type: 'sawtooth', dur: 0.35, vol: 0.08 })
  },
  tick: (c) => tone(c, { freq: 1400, type: 'square', dur: 0.025, vol: 0.05 }),
  countdown: (c) => tone(c, { freq: 660, type: 'triangle', dur: 0.15, vol: 0.2 }),
  go: (c) => tone(c, { freq: 990, type: 'triangle', dur: 0.35, vol: 0.25 }),
  gameOver: (c) => [784, 659, 523, 392].forEach((f, i) => tone(c, { freq: f, type: 'triangle', at: i * 0.12, dur: 0.2, vol: 0.18 })),
  ticket: (c) => [784, 1047, 1319].forEach((f, i) => tone(c, { freq: f, type: 'sine', at: i * 0.08, dur: 0.25, vol: 0.18 })),
  fanfare: (c) => {
    ;[523, 659, 784].forEach((f, i) => tone(c, { freq: f, type: 'triangle', at: i * 0.12, dur: 0.18, vol: 0.2 }))
    tone(c, { freq: 1047, type: 'triangle', at: 0.36, dur: 0.7, vol: 0.25 })
    tone(c, { freq: 784, type: 'sine', at: 0.36, dur: 0.7, vol: 0.12 })
  },
}

export const sound = {
  /** Call from a click/tap so the browser lets us play audio. */
  unlock() {
    const c = audio()
    if (c?.state === 'suspended') void c.resume()
  },

  play(name: SoundName) {
    if (muted) return
    const c = audio()
    if (!c || c.state !== 'running') return
    try {
      sounds[name](c)
    } catch {
      /* never let a sound effect break the app */
    }
  },

  get muted() {
    return muted
  },

  setMuted(value: boolean) {
    muted = value
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0')
    } catch {
      /* ignore */
    }
    if (!value) sound.unlock()
    listeners.forEach((l) => l())
  },
}

export function useMuted() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => muted,
  )
}
