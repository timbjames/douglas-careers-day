import { useCallback, useEffect, useState } from 'react'
import { ApiError, type AdminApi, type LeaderboardEntry } from '../../api'

/** Moderate the Bug Squash leaderboard: remove rude nicknames, or wipe it at the end of the day. */
export default function ScoresPanel({ client }: { client: AdminApi }) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [wipeText, setWipeText] = useState('')

  const load = useCallback(async () => {
    try {
      setScores(await client.scores())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load scores.')
    }
  }, [client])

  useEffect(() => {
    // Initial fetch: state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
    setConfirmDelete(null)
    await load()
  }

  return (
    <section className="panel">
      <div className="inline-form">
        <p className="muted" style={{ flex: 1, margin: 0 }}>
          {scores.length} score{scores.length === 1 ? '' : 's'} on the Bug Squash leaderboard
        </p>
        <button className="btn btn--ghost" onClick={load}>
          Refresh
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <table className="table">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Nickname</th>
            <th>Score</th>
            <th>When</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.id}>
              <td>{s.rank}</td>
              <td>{s.nickname}</td>
              <td className="mono">{s.score}</td>
              <td>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td className="table__actions">
                {confirmDelete === s.id ? (
                  <>
                    <button className="btn btn--danger btn--small" onClick={() => run(() => client.deleteScore(s.id))}>
                      Remove?
                    </button>
                    <button className="btn btn--link" onClick={() => setConfirmDelete(null)}>
                      cancel
                    </button>
                  </>
                ) : (
                  <button className="btn btn--link" onClick={() => setConfirmDelete(s.id)}>
                    remove
                  </button>
                )}
              </td>
            </tr>
          ))}
          {scores.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                No scores yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="danger-zone">
        <h2>Reset the leaderboard</h2>
        <p className="muted">
          Delete every game score. Type <strong>WIPE</strong> to confirm.
        </p>
        <div className="inline-form">
          <input value={wipeText} onChange={(e) => setWipeText(e.target.value)} aria-label="Type WIPE to confirm" />
          <button
            className="btn btn--danger"
            disabled={wipeText !== 'WIPE'}
            onClick={() =>
              run(async () => {
                await client.wipeScores()
                setWipeText('')
              })
            }
          >
            Wipe all scores
          </button>
        </div>
      </div>
    </section>
  )
}
