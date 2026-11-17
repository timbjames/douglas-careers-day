/**
 * The offline edition's "server": every API call, implemented in the browser and saved to
 * localStorage. It mirrors the real API (api/Raffle/RaffleEndpoints.cs, api/Game/GameEndpoints.cs):
 * same validation, same error messages, same live events, so the rest of the app can't tell the
 * difference. Data stays on this one browser/device.
 */
import {
  ApiError,
  type Entry,
  type Health,
  type LeaderboardEntry,
  type Prize,
  type PublicPrize,
  type RaffleStats,
  type SubmittedScore,
  type Ticket,
  type Winner,
} from '../apiTypes'
import { OFFLINE_ADMIN_PIN } from '../env'
import { emitLive } from '../live'
import { MAX_SCORE, nicknameError, normaliseName } from './rules'

interface StoredEntry {
  id: number
  ticketNumber: string
  displayName: string
  createdAt: string
  isWinner: boolean
  wonAt: string | null
  prizeId: number | null
  forfeited: boolean
}

interface StoredPrize {
  id: number
  name: string
  quantity: number
  sortOrder: number
}

interface StoredScore {
  id: number
  nickname: string
  score: number
  createdAt: string
}

interface Db {
  nextId: number
  entries: StoredEntry[]
  prizes: StoredPrize[]
  scores: StoredScore[]
}

const KEY = 'careersday.offline.v1'

function load(): Db {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as Db
  } catch {
    /* fall through to an empty database */
  }
  return { nextId: 1, entries: [], prizes: [], scores: [] }
}

/** Read, change and save in one go, always starting from the latest data (another tab may have written). */
function update<T>(change: (db: Db) => T): T {
  const db = load()
  const result = change(db)
  try {
    localStorage.setItem(KEY, JSON.stringify(db))
  } catch {
    throw new ApiError("Couldn't save: this browser's storage is full or blocked.", 507)
  }
  return result
}

const fail = (message: string, status = 400): never => {
  throw new ApiError(message, status)
}

const now = () => new Date().toISOString()
const randomInt = (min: number, max: number) => {
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return min + (a[0] % (max - min))
}

const awardedFor = (db: Db, prizeId: number) => db.entries.filter((e) => e.isWinner && e.prizeId === prizeId).length
const prizeName = (db: Db, id: number | null) => db.prizes.find((p) => p.id === id)?.name ?? null

const ranked = (db: Db): LeaderboardEntry[] =>
  [...db.scores]
    .sort((a, b) => b.score - a.score || a.createdAt.localeCompare(b.createdAt) || a.id - b.id)
    .map((s, i) => ({ id: s.id, rank: i + 1, nickname: s.nickname, score: s.score, createdAt: s.createdAt }))

const toWinner = (db: Db, e: StoredEntry): Winner => ({
  id: e.id,
  ticketNumber: e.ticketNumber,
  displayName: e.displayName,
  prizeName: prizeName(db, e.prizeId),
  wonAt: e.wonAt,
})

// ---------------------------------------------------------------------------------------------
// Public calls
// ---------------------------------------------------------------------------------------------

export const offlineApi = {
  async health(): Promise<Health> {
    return { status: 'ok', database: true, time: now() }
  },

  async enterRaffle(firstName: string, lastInitial: string, className: string): Promise<Ticket> {
    const { displayName, error } = normaliseName(firstName, lastInitial, className)
    if (error) fail(error)
    const ticket = update((db) => {
      const taken = new Set(db.entries.map((e) => e.ticketNumber))
      if (taken.size >= 9000) fail("Couldn't allocate a ticket number, please try again.", 503)
      let number: string
      do number = String(randomInt(1000, 10000))
      while (taken.has(number))
      db.entries.push({
        id: db.nextId++,
        ticketNumber: number,
        displayName: displayName!,
        createdAt: now(),
        isWinner: false,
        wonAt: null,
        prizeId: null,
        forfeited: false,
      })
      return { ticketNumber: number, displayName: displayName!, entries: db.entries.length }
    })
    emitLive('EntryAdded', { displayName: ticket.displayName, entries: ticket.entries })
    return { ticketNumber: ticket.ticketNumber, displayName: ticket.displayName }
  },

  async raffleStats(): Promise<RaffleStats> {
    const db = load()
    const winners = db.entries.filter((e) => e.isWinner).length
    const totalPrizes = db.prizes.reduce((n, p) => n + p.quantity, 0)
    return { entries: db.entries.length, winners, prizesRemaining: Math.max(0, totalPrizes - winners) }
  },

  async winners(): Promise<Winner[]> {
    const db = load()
    return db.entries
      .filter((e) => e.isWinner)
      .sort((a, b) => (b.wonAt ?? '').localeCompare(a.wonAt ?? ''))
      .map((e) => toWinner(db, e))
  },

  async prizes(): Promise<PublicPrize[]> {
    const db = load()
    return [...db.prizes]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
      .map((p) => ({ name: p.name, quantity: p.quantity, remaining: p.quantity - awardedFor(db, p.id) }))
  },

  async config(): Promise<{ publicUrl: string | null }> {
    return { publicUrl: null }
  },

  async submitScore(rawNickname: string, score: number): Promise<SubmittedScore> {
    const { nickname, error } = nicknameError(rawNickname)
    if (error) fail(error)
    if (!Number.isInteger(score) || score < 0 || score > MAX_SCORE) fail("That score doesn't look right.")
    const result = update((db) => {
      const id = db.nextId++
      db.scores.push({ id, nickname: nickname!, score, createdAt: now() })
      // Ties go to whoever got there first, and this score is the newest.
      const better = db.scores.filter((s) => s.id !== id && s.score >= score).length
      return { id, rank: better + 1, score, nickname: nickname! }
    })
    emitLive('ScoreAdded', { nickname: result.nickname, score: result.score, rank: result.rank })
    return result
  },

  async leaderboard(top = 10): Promise<LeaderboardEntry[]> {
    return ranked(load()).slice(0, Math.min(Math.max(top, 1), 100))
  },
}

// ---------------------------------------------------------------------------------------------
// Admin calls (PIN from .env.offline, checked on every call like the real API)
// ---------------------------------------------------------------------------------------------

export function offlineAdminApi(pin: string, onUnauthorized?: () => void) {
  const guard = async <T>(action: () => T): Promise<T> => {
    if (pin !== OFFLINE_ADMIN_PIN) {
      onUnauthorized?.()
      fail('Wrong PIN.', 401)
    }
    return action()
  }

  const validPrize = (name: string) => {
    const n = name.trim()
    if (n.length < 1 || n.length > 100) fail('Prize name must be 1–100 characters.')
    return n
  }

  return {
    check: () => guard(() => undefined),

    prizes: () =>
      guard((): Prize[] => {
        const db = load()
        return [...db.prizes]
          .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
          .map((p) => ({ ...p, awarded: awardedFor(db, p.id) }))
      }),

    addPrize: (name: string, quantity: number) =>
      guard((): Prize => {
        const n = validPrize(name)
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) fail('Quantity must be between 1 and 1000.')
        const prize = update((db) => {
          const p = { id: db.nextId++, name: n, quantity, sortOrder: Math.max(0, ...db.prizes.map((x) => x.sortOrder)) + 1 }
          db.prizes.push(p)
          return { ...p, awarded: 0 }
        })
        emitLive('RaffleChanged')
        return prize
      }),

    updatePrize: (id: number, name: string, quantity: number) =>
      guard((): Prize => {
        const n = validPrize(name)
        const prize = update((db) => {
          const p = db.prizes.find((x) => x.id === id) ?? fail('Prize not found.', 404)
          const awarded = awardedFor(db, id)
          const min = Math.max(1, awarded)
          if (!Number.isInteger(quantity) || quantity < min || quantity > 1000)
            fail(`Quantity must be between ${min} and 1000 (${awarded} already won).`)
          p.name = n
          p.quantity = quantity
          return { ...p, awarded }
        })
        emitLive('RaffleChanged')
        return prize
      }),

    deletePrize: (id: number) =>
      guard(() => {
        update((db) => {
          if (awardedFor(db, id) > 0) fail("This prize has already been won, so it can't be deleted.", 409)
          if (!db.prizes.some((p) => p.id === id)) fail('Prize not found.', 404)
          db.prizes = db.prizes.filter((p) => p.id !== id)
        })
        emitLive('RaffleChanged')
      }),

    entries: () =>
      guard((): Entry[] => {
        const db = load()
        return [...db.entries]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((e) => ({
            id: e.id,
            ticketNumber: e.ticketNumber,
            displayName: e.displayName,
            createdAt: e.createdAt,
            isWinner: e.isWinner,
            forfeited: e.forfeited,
            prizeName: prizeName(db, e.prizeId),
          }))
      }),

    deleteEntry: (id: number) =>
      guard(() => {
        update((db) => {
          if (!db.entries.some((e) => e.id === id)) fail('Entry not found.', 404)
          db.entries = db.entries.filter((e) => e.id !== id)
        })
        emitLive('RaffleChanged')
      }),

    wipeEntries: () =>
      guard(() => {
        const deleted = update((db) => {
          const n = db.entries.length
          db.entries = []
          return n
        })
        emitLive('RaffleChanged')
        return { deleted }
      }),

    draw: (prizeId: number) =>
      guard((): Winner => {
        const winner = update((db) => {
          const prize = db.prizes.find((p) => p.id === prizeId) ?? fail('Prize not found.', 404)
          if (awardedFor(db, prizeId) >= prize.quantity) fail(`All ${prize.quantity} of "${prize.name}" have been won.`, 409)
          const eligible = db.entries.filter((e) => !e.isWinner && !e.forfeited)
          if (eligible.length === 0) fail('There are no entries left to draw from.', 409)
          const w = eligible[randomInt(0, eligible.length)]
          w.isWinner = true
          w.wonAt = now()
          w.prizeId = prizeId
          return toWinner(db, w)
        })
        emitLive('WinnerDrawn', { ticketNumber: winner.ticketNumber, displayName: winner.displayName, prizeName: winner.prizeName })
        return winner
      }),

    forfeit: (entryId: number) =>
      guard(() => {
        update((db) => {
          const e = db.entries.find((x) => x.id === entryId) ?? fail('Entry not found.', 404)
          if (!e.isWinner) fail("That ticket hasn't won anything.", 409)
          e.isWinner = false
          e.wonAt = null
          e.prizeId = null
          e.forfeited = true
        })
        emitLive('RaffleChanged')
      }),

    scores: () => guard(() => ranked(load()).slice(0, 500)),

    deleteScore: (id: number) =>
      guard(() => {
        update((db) => {
          if (!db.scores.some((s) => s.id === id)) fail('Score not found.', 404)
          db.scores = db.scores.filter((s) => s.id !== id)
        })
        emitLive('LeaderboardChanged')
      }),

    deleteScores: (ids: number[]) =>
      guard(() => {
        const unique = new Set(ids)
        if (unique.size === 0) fail('Pick at least one score to delete.')
        if (unique.size > 500) fail("That's too many scores at once.")
        const deleted = update((db) => {
          const before = db.scores.length
          db.scores = db.scores.filter((s) => !unique.has(s.id))
          return before - db.scores.length
        })
        if (deleted > 0) emitLive('LeaderboardChanged')
        return { deleted }
      }),

    wipeScores: () =>
      guard(() => {
        const deleted = update((db) => {
          const n = db.scores.length
          db.scores = []
          return n
        })
        emitLive('LeaderboardChanged')
        return { deleted }
      }),
  }
}
