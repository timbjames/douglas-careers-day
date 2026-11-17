/** Shapes shared by the online API client (api.ts) and the offline edition (offline/store.ts). */

export interface Health {
  status: 'ok' | 'degraded'
  database: boolean
  time: string
}

export interface Ticket {
  ticketNumber: string
  displayName: string
}

export interface RaffleStats {
  entries: number
  winners: number
  prizesRemaining: number
}

export interface Winner {
  id: number
  ticketNumber: string
  displayName: string
  prizeName: string | null
  wonAt: string | null
}

export interface Entry {
  id: number
  ticketNumber: string
  displayName: string
  createdAt: string
  isWinner: boolean
  forfeited: boolean
  prizeName: string | null
}

export interface PublicPrize {
  name: string
  quantity: number
  remaining: number
}

export interface Prize {
  id: number
  name: string
  quantity: number
  sortOrder: number
  awarded: number
}

export interface LeaderboardEntry {
  id: number
  rank: number
  nickname: string
  score: number
  createdAt: string
}

export interface SubmittedScore {
  id: number
  rank: number
  score: number
  nickname: string
}

/** Error carrying the friendly message the API sends back as { error: "..." }. */
export class ApiError extends Error {
  readonly status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}
