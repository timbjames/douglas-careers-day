import { useCallback, useEffect, useState } from 'react'
import { ApiError, type AdminApi, type LeaderboardEntry } from '../../api'
import { useLiveEvent } from '../../live'

/**
 * Moderate the Bug Squash leaderboard: delete single scores (e.g. a cheeky nickname), tick several
 * and delete them together, or wipe the whole board at the end of the day.
 */
export default function ScoresPanel({ client }: { client: AdminApi }) {
  const [scores, setScores] = useState<LeaderboardEntry[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<number | 'selected' | null>(null)
  const [busy, setBusy] = useState(false)
  const [wipeText, setWipeText] = useState('')

  const load = useCallback(async () => {
    try {
      const rows = await client.scores()
      setScores(rows)
      // Forget ticks for scores that no longer exist.
      setSelected((sel) => new Set([...sel].filter((id) => rows.some((r) => r.id === id))))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load scores.')
    }
  }, [client])

  useEffect(() => {
    // Initial fetch: state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // New scores arrive while you're looking at the list.
  useLiveEvent('ScoreAdded', () => void load())
  useLiveEvent('LeaderboardChanged', () => void load())

  const run = async (action: () => Promise<string>) => {
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      setNotice(await action())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
      setConfirm(null)
    }
    await load()
  }

  const deleteOne = (s: LeaderboardEntry) =>
    run(async () => {
      await client.deleteScore(s.id)
      return `Deleted ${s.nickname}'s score of ${s.score}.`
    })

  const deleteSelected = () =>
    run(async () => {
      const { deleted } = await client.deleteScores([...selected])
      setSelected(new Set())
      return `Deleted ${deleted} score${deleted === 1 ? '' : 's'}.`
    })

  const toggle = (id: number) =>
    setSelected((sel) => {
      const next = new Set(sel)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const allTicked = scores.length > 0 && selected.size === scores.length
  const someTicked = selected.size > 0 && !allTicked

  return (
    <section className="panel">
      <div className="toolbar">
        <p className="muted toolbar__info">
          {scores.length} score{scores.length === 1 ? '' : 's'} on the Bug Squash leaderboard
          {selected.size > 0 && ` · ${selected.size} selected`}
        </p>
        {confirm === 'selected' ? (
          <>
            <button className="btn btn--danger" disabled={busy} onClick={deleteSelected}>
              Yes, delete {selected.size}
            </button>
            <button className="btn btn--ghost" onClick={() => setConfirm(null)}>
              Cancel
            </button>
          </>
        ) : (
          <button className="btn btn--danger" disabled={selected.size === 0 || busy} onClick={() => setConfirm('selected')}>
            🗑 Delete selected{selected.size > 0 ? ` (${selected.size})` : ''}
          </button>
        )}
        <button className="btn btn--ghost" onClick={load}>
          Refresh
        </button>
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <table className="table">
        <thead>
          <tr>
            <th className="table__check">
              <input
                type="checkbox"
                aria-label="Select all scores"
                checked={allTicked}
                ref={(el) => {
                  if (el) el.indeterminate = someTicked
                }}
                onChange={() => setSelected(allTicked ? new Set() : new Set(scores.map((s) => s.id)))}
              />
            </th>
            <th>Rank</th>
            <th>Nickname</th>
            <th>Score</th>
            <th>When</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {scores.map((s) => (
            <tr key={s.id} className={selected.has(s.id) ? 'is-selected' : undefined}>
              <td className="table__check">
                <input
                  type="checkbox"
                  aria-label={`Select ${s.nickname} (${s.score})`}
                  checked={selected.has(s.id)}
                  onChange={() => toggle(s.id)}
                />
              </td>
              <td>{s.rank}</td>
              <td>{s.nickname}</td>
              <td className="mono">{s.score}</td>
              <td>{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td className="table__actions">
                {confirm === s.id ? (
                  <>
                    <button className="btn btn--danger btn--small" disabled={busy} onClick={() => deleteOne(s)}>
                      Yes, delete
                    </button>
                    <button className="btn btn--link" onClick={() => setConfirm(null)}>
                      cancel
                    </button>
                  </>
                ) : (
                  <button className="btn btn--danger-outline btn--small" onClick={() => setConfirm(s.id)}>
                    🗑 Delete
                  </button>
                )}
              </td>
            </tr>
          ))}
          {scores.length === 0 && (
            <tr>
              <td colSpan={6} className="muted">
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
            disabled={wipeText !== 'WIPE' || busy}
            onClick={() =>
              run(async () => {
                const { deleted } = await client.wipeScores()
                setWipeText('')
                setSelected(new Set())
                return `Leaderboard wiped (${deleted} score${deleted === 1 ? '' : 's'} deleted).`
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
