import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useEffect, useRef, useSyncExternalStore } from 'react'

/** Payloads broadcast by the API (api/Live/LiveHub.cs). */
export interface LiveEvents {
  EntryAdded: { displayName: string; entries: number }
  ScoreAdded: { nickname: string; score: number; rank: number }
  WinnerDrawn: { ticketNumber: string; displayName: string; prizeName: string | null }
  RaffleChanged: void
  LeaderboardChanged: void
  /** Not sent by the server: fired after the connection comes back, since events may have been missed. */
  Reconnected: void
}

type EventName = keyof LiveEvents
type Status = 'connecting' | 'connected' | 'reconnecting'

let connection: HubConnection | null = null
let status: Status = 'connecting'
const statusListeners = new Set<() => void>()
const reconnectListeners = new Set<() => void>()

function setStatus(s: Status) {
  status = s
  statusListeners.forEach((l) => l())
}

/** One shared connection for the whole app, created on first use. */
function getConnection() {
  if (connection) return connection

  connection = new HubConnectionBuilder()
    .withUrl('/hubs/live')
    // Keep retrying forever (school wifi drops): 1s, 2s, 4s… capped at 10s.
    .withAutomaticReconnect({ nextRetryDelayInMilliseconds: (ctx) => Math.min(10_000, 1000 * 2 ** ctx.previousRetryCount) })
    .configureLogging(LogLevel.Warning)
    .build()

  connection.onreconnecting(() => setStatus('reconnecting'))
  connection.onreconnected(() => {
    setStatus('connected')
    reconnectListeners.forEach((l) => l())
  })
  connection.onclose(() => {
    setStatus('reconnecting')
    setTimeout(start, 5000)
  })

  start()
  return connection
}

function start() {
  const c = connection
  if (!c || c.state !== HubConnectionState.Disconnected) return
  c.start()
    .then(() => {
      // Treat the first connect like a reconnect too, in case something happened while connecting.
      const wasDown = status !== 'connecting'
      setStatus('connected')
      if (wasDown) reconnectListeners.forEach((l) => l())
    })
    .catch(() => {
      setStatus('reconnecting')
      setTimeout(start, 5000) // the API isn't up yet: keep trying
    })
}

/**
 * Run `handler` whenever the server broadcasts `event`.
 * The latest handler is always used, so it can safely close over component state.
 */
export function useLiveEvent<E extends EventName>(event: E, handler: (payload: LiveEvents[E]) => void) {
  const ref = useRef(handler)
  useEffect(() => {
    ref.current = handler
  })

  useEffect(() => {
    if (event === 'Reconnected') {
      const l = () => (ref.current as () => void)()
      reconnectListeners.add(l)
      getConnection()
      return () => {
        reconnectListeners.delete(l)
      }
    }
    const c = getConnection()
    const h = (payload: LiveEvents[E]) => ref.current(payload)
    c.on(event, h)
    return () => c.off(event, h)
  }, [event])
}

/** Live connection status, e.g. to show a "reconnecting…" hint. */
export function useLiveStatus(): Status {
  return useSyncExternalStore(
    (l) => {
      getConnection()
      statusListeners.add(l)
      return () => statusListeners.delete(l)
    },
    () => status,
  )
}
