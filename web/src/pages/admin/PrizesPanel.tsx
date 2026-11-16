import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { ApiError, type AdminApi, type Prize } from '../../api'

export default function PrizesPanel({ client, onChange }: { client: AdminApi; onChange: () => void }) {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setPrizes(await client.prizes())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load prizes.')
    }
  }, [client])

  useEffect(() => {
    // Initial fetch: state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  // Runs an action, then reloads and reports any error from the server.
  const run = async (action: () => Promise<unknown>) => {
    setError(null)
    try {
      await action()
      onChange()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    }
    await load()
  }

  return (
    <section className="panel">
      <AddPrizeForm onAdd={(name, qty) => run(() => client.addPrize(name, qty))} />

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      {prizes.length === 0 ? (
        <p className="muted">No prizes yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Prize</th>
              <th>Quantity</th>
              <th>Won</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {prizes.map((p) => (
              <PrizeRow
                key={`${p.id}-${p.name}-${p.quantity}`}
                prize={p}
                onSave={(name, qty) => run(() => client.updatePrize(p.id, name, qty))}
                onDelete={() => run(() => client.deletePrize(p.id))}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

function AddPrizeForm({ onAdd }: { onAdd: (name: string, quantity: number) => Promise<void> }) {
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState(1)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    await onAdd(name, quantity)
    setName('')
    setQuantity(1)
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <input placeholder="Prize name, e.g. Raspberry Pi" value={name} onChange={(e) => setName(e.target.value)} />
      <input
        type="number"
        min={1}
        max={1000}
        value={quantity}
        onChange={(e) => setQuantity(Number(e.target.value))}
        aria-label="Quantity"
        className="input--narrow"
      />
      <button className="btn btn--primary" disabled={name.trim() === ''}>
        Add prize
      </button>
    </form>
  )
}

interface RowProps {
  prize: Prize
  onSave: (name: string, quantity: number) => void
  onDelete: () => void
}

function PrizeRow({ prize, onSave, onDelete }: RowProps) {
  const [name, setName] = useState(prize.name)
  const [quantity, setQuantity] = useState(prize.quantity)
  const [confirming, setConfirming] = useState(false)
  const dirty = name !== prize.name || quantity !== prize.quantity

  return (
    <tr>
      <td>
        <input value={name} onChange={(e) => setName(e.target.value)} aria-label="Prize name" />
      </td>
      <td>
        <input
          type="number"
          min={Math.max(1, prize.awarded)}
          max={1000}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          aria-label="Quantity"
          className="input--narrow"
        />
      </td>
      <td>{prize.awarded}</td>
      <td className="table__actions">
        {dirty && (
          <button className="btn btn--primary btn--small" onClick={() => onSave(name, quantity)}>
            Save
          </button>
        )}
        {prize.awarded === 0 &&
          (confirming ? (
            <>
              <button className="btn btn--danger btn--small" onClick={onDelete}>
                Delete?
              </button>
              <button className="btn btn--link" onClick={() => setConfirming(false)}>
                cancel
              </button>
            </>
          ) : (
            <button className="btn btn--link" onClick={() => setConfirming(true)}>
              delete
            </button>
          ))}
      </td>
    </tr>
  )
}
