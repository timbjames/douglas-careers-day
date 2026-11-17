import { useEffect, useState } from 'react'
import { api } from '../api'
import { OFFLINE } from '../env'

type State = 'checking' | 'ok' | 'db-down' | 'api-down'

const labels: Record<State, string> = {
  checking: 'Checking…',
  ok: OFFLINE ? 'Offline edition · saved in this browser' : 'API + database online',
  'db-down': 'API online, database offline',
  'api-down': 'API offline',
}

/** Small corner badge so you can see at a glance that the whole stack is up. */
export function StatusBadge() {
  const [state, setState] = useState<State>('checking')

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      try {
        const h = await api.health()
        if (!cancelled) setState(h.database ? 'ok' : 'db-down')
      } catch {
        if (!cancelled) setState('api-down')
      }
    }
    check()
    const id = setInterval(check, 10_000)
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [])

  return (
    <div className={`status status--${state}`} role="status">
      <span className="status__dot" />
      {labels[state]}
    </div>
  )
}
