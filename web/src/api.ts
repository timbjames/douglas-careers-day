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

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init.headers },
    })
  } catch {
    throw new ApiError("Can't reach the server. Is it running?", 0)
  }
  if (res.status === 204) return undefined as T
  const body = await res.json().catch(() => null)
  if (!res.ok) {
    const message = body && typeof body.error === 'string' ? body.error : `Something went wrong (${res.status})`
    throw new ApiError(message, res.status)
  }
  return body as T
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  body: data === undefined ? undefined : JSON.stringify(data),
})

export const api = {
  async health(): Promise<Health> {
    // /api/health returns 503 with a JSON body when the DB is down, so read the body either way.
    const res = await fetch('/api/health')
    const body = await res.json().catch(() => null)
    if (body === null) throw new Error(`${res.status} ${res.statusText}`)
    return body as Health
  },

  enterRaffle: (firstName: string, lastInitial: string) =>
    request<Ticket>('/api/raffle/entries', json('POST', { firstName, lastInitial })),
  raffleStats: () => request<RaffleStats>('/api/raffle/stats'),
  winners: () => request<Winner[]>('/api/raffle/winners'),
  prizes: () => request<PublicPrize[]>('/api/raffle/prizes'),
  config: () => request<{ publicUrl: string | null }>('/api/config'),

  submitScore: (nickname: string, score: number) =>
    request<SubmittedScore>('/api/game/scores', json('POST', { nickname, score })),
  leaderboard: (top = 10) => request<LeaderboardEntry[]>(`/api/game/leaderboard?top=${top}`),
}

/**
 * Admin calls send the PIN in a header; the server checks it on every request.
 * `onUnauthorized` fires if the server rejects the PIN, so the page can lock itself again.
 */
export function adminApi(pin: string, onUnauthorized?: () => void) {
  const headers = { 'X-Admin-Pin': pin }
  const call = async <T>(url: string, init: RequestInit = {}) => {
    try {
      return await request<T>(url, { ...init, headers })
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) onUnauthorized?.()
      throw err
    }
  }

  return {
    check: () => call<void>('/api/admin/check'),
    prizes: () => call<Prize[]>('/api/admin/prizes'),
    addPrize: (name: string, quantity: number) => call<Prize>('/api/admin/prizes', json('POST', { name, quantity })),
    updatePrize: (id: number, name: string, quantity: number) =>
      call<Prize>(`/api/admin/prizes/${id}`, json('PUT', { name, quantity })),
    deletePrize: (id: number) => call<void>(`/api/admin/prizes/${id}`, json('DELETE')),
    entries: () => call<Entry[]>('/api/admin/raffle/entries'),
    deleteEntry: (id: number) => call<void>(`/api/admin/raffle/entries/${id}`, json('DELETE')),
    wipeEntries: () => call<{ deleted: number }>('/api/admin/raffle/entries', json('DELETE')),
    draw: (prizeId: number) => call<Winner>('/api/admin/raffle/draw', json('POST', { prizeId })),
    forfeit: (entryId: number) => call<void>(`/api/admin/raffle/entries/${entryId}/forfeit`, json('POST')),
    scores: () => call<LeaderboardEntry[]>('/api/admin/game/scores'),
    deleteScore: (id: number) => call<void>(`/api/admin/game/scores/${id}`, json('DELETE')),
    deleteScores: (ids: number[]) => call<{ deleted: number }>('/api/admin/game/scores/delete', json('POST', { ids })),
    wipeScores: () => call<{ deleted: number }>('/api/admin/game/scores', json('DELETE')),
  }
}

export type AdminApi = ReturnType<typeof adminApi>
