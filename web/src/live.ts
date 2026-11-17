import { HubConnectionBuilder, HubConnectionState, LogLevel, type HubConnection } from '@microsoft/signalr'
import { useEffect, useRef, useSyncExternalStore } from 'react'
import { OFFLINE } from './env'

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

// ---------------------------------------------------------------------------------------------
// Offline edition: no server, so events are delivered to this tab directly and to other tabs
// (e.g. the big screen) through localStorage "storage" events, which also work for a file opened
// straight from disk.
// ---------------------------------------------------------------------------------------------

const OFFLINE_EVENT_KEY = 'careersday.offline.event'
const offlineListeners = new Map<string, Set<(payload: unknown) => void>>()
let offlineStorageHooked = false

function dispatchOffline(event: string, payload: unknown) {
  offlineListeners.get(event)?.forEach((l) => l(payload))
}

function hookOfflineStorage() {
  if (offlineStorageHooked) return
  offlineStorageHooked = true
  window.addEventListener('storage', (e) => {
    if (e.key !== OFFLINE_EVENT_KEY || !e.newValue) return
    try {
      const { event, payload } = JSON.parse(e.newValue) as { event: string; payload: unknown }
      dispatchOffline(event, payload)
    } catch {
      /* ignore malformed events */
    }
  })
}

/** Offline edition only: broadcast an event, as the API would over SignalR. */
export function emitLive<E extends EventName>(event: E, ...payload: LiveEvents[E] extends void ? [] : [LiveEvents[E]]) {
  const data = payload[0]
  dispatchOffline(event, data)
  try {
    // A unique id makes every write a change, so other tabs always get the event.
    localStorage.setItem(OFFLINE_EVENT_KEY, JSON.stringify({ event, payload: data, id: crypto.randomUUID() }))
  } catch {
    /* other tabs just miss this one; they also refresh every 30s */
  }
}

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
    if (OFFLINE) {
      hookOfflineStorage()
      const h = (payload: unknown) => (ref.current as (p: unknown) => void)(payload)
      const set = offlineListeners.get(event) ?? new Set()
      offlineListeners.set(event, set)
      set.add(h)
      return () => {
        set.delete(h)
      }
    }
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
      if (OFFLINE) return () => {} // always "connected": everything is in this browser
      getConnection()
      statusListeners.add(l)
      return () => statusListeners.delete(l)
    },
    () => (OFFLINE ? 'connected' : status),
  )
}
