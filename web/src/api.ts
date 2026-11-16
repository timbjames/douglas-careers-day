export interface Health {
  status: 'ok' | 'degraded'
  database: boolean
  time: string
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  // /api/health returns 503 with a JSON body when the DB is down, so read the body either way.
  const body = await res.json().catch(() => null)
  if (body === null) throw new Error(`${res.status} ${res.statusText}`)
  return body as T
}

export const api = {
  health: () => getJson<Health>('/api/health'),
}
