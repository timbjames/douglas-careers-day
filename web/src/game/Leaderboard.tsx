import { useCallback, useEffect, useState } from 'react'
import { api, type LeaderboardEntry } from '../api'
import { useLiveEvent } from '../live'

interface Props {
  /** Score id to highlight, e.g. the one the player just submitted. */
  highlightId?: number | null
  /** Change this to force a reload (e.g. after submitting a score). */
  refreshKey?: number
  top?: number
  title?: string
  className?: string
}

const medals = ['🥇', '🥈', '🥉']

export function Leaderboard({ highlightId, refreshKey = 0, top = 10, title = '🏆 Top squashers', className = '' }: Props) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)

  const load = useCallback(() => {
    api
      .leaderboard(top)
      .then(setRows)
      .catch(() => {})
  }, [top])

  // Live updates from every device, plus a slow poll as a safety net.
  useLiveEvent('ScoreAdded', load)
  useLiveEvent('LeaderboardChanged', load)
  useLiveEvent('Reconnected', load)

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set once the request resolves
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [load, refreshKey])

  return (
    <aside className={`leaderboard ${className}`}>
      <h2>{title}</h2>
      {rows === null ? (
        <p className="muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="muted">No scores yet. Be the first!</p>
      ) : (
        <ol>
          {rows.map((r) => (
            <li key={r.id} className={r.id === highlightId ? 'leaderboard__you' : undefined}>
              <span className="leaderboard__rank">{medals[r.rank - 1] ?? r.rank}</span>
              <span className="leaderboard__name">{r.nickname}</span>
              <span className="leaderboard__score">{r.score}</span>
            </li>
          ))}
        </ol>
      )}
    </aside>
  )
}
