import { useCallback, useEffect, useState } from 'react'
import { ApiError, type AdminApi, type Entry } from '../../api'

export default function EntriesPanel({ client, onChange }: { client: AdminApi; onChange: () => void }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [filter, setFilter] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null)
  const [wipeText, setWipeText] = useState('')

  const load = useCallback(async () => {
    try {
      setEntries(await client.entries())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load entries.')
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
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
    setConfirmDelete(null)
    await load()
  }

  const q = filter.trim().toLowerCase()
  const shown = q
    ? entries.filter((e) => e.ticketNumber.includes(q) || e.displayName.toLowerCase().includes(q))
    : entries

  return (
    <section className="panel">
      <div className="inline-form">
        <input placeholder="Search by ticket or name" value={filter} onChange={(e) => setFilter(e.target.value)} />
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
            <th>Ticket</th>
            <th>Name</th>
            <th>Entered</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {shown.map((e) => (
            <tr key={e.id}>
              <td className="mono">{e.ticketNumber}</td>
              <td>{e.displayName}</td>
              <td>{new Date(e.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
              <td>
                {e.isWinner ? `🏆 ${e.prizeName}` : e.forfeited ? 'Forfeited' : ''}
              </td>
              <td className="table__actions">
                {confirmDelete === e.id ? (
                  <>
                    <button className="btn btn--danger btn--small" onClick={() => run(() => client.deleteEntry(e.id))}>
                      Delete?
                    </button>
                    <button className="btn btn--link" onClick={() => setConfirmDelete(null)}>
                      cancel
                    </button>
                  </>
                ) : (
                  <button className="btn btn--link" onClick={() => setConfirmDelete(e.id)}>
                    delete
                  </button>
                )}
              </td>
            </tr>
          ))}
          {shown.length === 0 && (
            <tr>
              <td colSpan={5} className="muted">
                {entries.length === 0 ? 'No entries yet.' : 'No matches.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="danger-zone">
        <h2>End of the day</h2>
        <p className="muted">
          Delete every raffle entry, winners included. Prizes are kept. Type <strong>WIPE</strong> to confirm.
        </p>
        <div className="inline-form">
          <input value={wipeText} onChange={(e) => setWipeText(e.target.value)} aria-label="Type WIPE to confirm" />
          <button
            className="btn btn--danger"
            disabled={wipeText !== 'WIPE'}
            onClick={() =>
              run(async () => {
                await client.wipeEntries()
                setWipeText('')
              })
            }
          >
            Wipe all entries
          </button>
        </div>
      </div>
    </section>
  )
}
