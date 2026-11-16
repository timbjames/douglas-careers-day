import { useEffect, useState } from 'react'
import { api, type LeaderboardEntry } from '../api'

interface Props {
  /** Score id to highlight, e.g. the one the player just submitted. */
  highlightId?: number | null
  /** Change this to force a reload (e.g. after submitting a score). */
  refreshKey?: number
  top?: number
  title?: string
}

const medals = ['🥇', '🥈', '🥉']

export function Leaderboard({ highlightId, refreshKey = 0, top = 10, title = '🏆 Top squashers' }: Props) {
  const [rows, setRows] = useState<LeaderboardEntry[] | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      api
        .leaderboard(top)
        .then((r) => !cancelled && setRows(r))
        .catch(() => {})
    load()
    const id = setInterval(load, 10_000) // pick up scores from other devices
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [top, refreshKey])

  return (
    <aside className="leaderboard">
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
