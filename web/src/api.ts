import { OFFLINE } from './env'
import { offlineAdminApi, offlineApi } from './offline/store'
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
} from './apiTypes'

export * from './apiTypes'

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

const onlineApi = {
  async health(): Promise<Health> {
    // /api/health returns 503 with a JSON body when the DB is down, so read the body either way.
    const res = await fetch('/api/health')
    const body = await res.json().catch(() => null)
    if (body === null) throw new Error(`${res.status} ${res.statusText}`)
    return body as Health
  },

  enterRaffle: (firstName: string, lastInitial: string, className: string) =>
    request<Ticket>('/api/raffle/entries', json('POST', { firstName, lastInitial, className })),
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
function onlineAdminApi(pin: string, onUnauthorized?: () => void) {
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

export type Api = typeof onlineApi
export type AdminApi = ReturnType<typeof onlineAdminApi>

/**
 * The rest of the app only ever uses `api` and `adminApi`. In the offline edition they're swapped
 * for a version that keeps everything in this browser (see offline/store.ts).
 */
export const api: Api = OFFLINE ? offlineApi : onlineApi
export const adminApi: (pin: string, onUnauthorized?: () => void) => AdminApi = OFFLINE ? offlineAdminApi : onlineAdminApi
