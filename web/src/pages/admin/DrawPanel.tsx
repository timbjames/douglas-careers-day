import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, type AdminApi, type Entry, type Prize, type Winner } from '../../api'
import { celebrate } from '../../confetti'
import { sound } from '../../sound'

type Phase = 'idle' | 'spinning' | 'revealed'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

interface Props {
  client: AdminApi
  onChange: () => void
  goToPrizes: () => void
}

export default function DrawPanel({ client, onChange, goToPrizes }: Props) {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [entries, setEntries] = useState<Entry[]>([])
  const [prizeId, setPrizeId] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [display, setDisplay] = useState('????')
  const [winner, setWinner] = useState<Winner | null>(null)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(true)
  const lastDrawPrizeId = useRef<number | null>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  const load = useCallback(async () => {
    try {
      const [p, e] = await Promise.all([client.prizes(), client.entries()])
      setPrizes(p)
      setEntries(e)
      // Keep the current choice if it still has prizes left, otherwise pick the next available one.
      setPrizeId((current) => {
        const stillOk = p.find((x) => x.id === current && x.awarded < x.quantity)
        return stillOk ? stillOk.id : (p.find((x) => x.awarded < x.quantity)?.id ?? null)
      })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load prizes.')
    }
  }, [client])

  useEffect(() => {
    // Initial fetch: state is only set after the request resolves.
    // oxlint-disable-next-line react/set-state-in-effect
    void load()
  }, [load])

  const eligible = entries.filter((e) => !e.isWinner && !e.forfeited)
  const winners = entries.filter((e) => e.isWinner)

  const draw = async (id: number) => {
    sound.unlock()
    lastDrawPrizeId.current = id
    setError(null)
    setWinner(null)
    setPhase('spinning')
    try {
      // The server picks the winner; the spin is just for show.
      const result = await client.draw(id)
      const pool = eligible.length > 0 ? eligible.map((e) => e.ticketNumber) : [result.ticketNumber]
      for (let delay = 40; delay < 450 && mounted.current; delay *= 1.1) {
        setDisplay(pool[Math.floor(Math.random() * pool.length)])
        sound.play('tick')
        await sleep(delay)
      }
      if (!mounted.current) return
      setDisplay(result.ticketNumber)
      setWinner(result)
      setPhase('revealed')
      celebrate()
      sound.play('fanfare')
      onChange()
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'The draw failed, please try again.')
      setPhase('idle')
      await load()
    }
  }

  const forfeitAndRedraw = async (w: Winner) => {
    const id = lastDrawPrizeId.current
    if (id === null) return
    try {
      await client.forfeit(w.id)
      setPrizeId(id)
      await draw(id)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not redraw.')
    }
  }

  const forfeit = async (entry: Entry) => {
    try {
      await client.forfeit(entry.id)
      onChange()
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not forfeit.')
    }
  }

  const selected = prizes.find((p) => p.id === prizeId)

  if (prizes.length === 0)
    return (
      <section className="panel empty">
        <p>No prizes yet. Add what you're giving away first.</p>
        <button className="btn btn--primary" onClick={goToPrizes}>
          Add prizes
        </button>
      </section>
    )

  return (
    <section className="panel draw">
      <div className="draw__prizes">
        {prizes.map((p) => {
          const left = p.quantity - p.awarded
          return (
            <button
              key={p.id}
              className={`prize-chip ${p.id === prizeId ? 'prize-chip--active' : ''}`}
              disabled={left === 0 || phase === 'spinning'}
              onClick={() => {
                setPrizeId(p.id)
                setPhase('idle')
              }}
            >
              <span className="prize-chip__name">{p.name}</span>
              <span className="prize-chip__left">{left === 0 ? 'all won' : `${left} left`}</span>
            </button>
          )
        })}
      </div>

      <div className={`draw__stage draw__stage--${phase}`}>
        {phase === 'idle' && (
          <>
            <p className="draw__for">{selected ? `Drawing for: ${selected.name}` : 'All prizes have been won 🎉'}</p>
            <p className="draw__number draw__number--dim">????</p>
            <p className="muted">{eligible.length} tickets in the hat</p>
          </>
        )}
        {phase === 'spinning' && (
          <>
            <p className="draw__for">Drawing for: {selected?.name}</p>
            <p className="draw__number">{display}</p>
            <p className="muted">🥁 …</p>
          </>
        )}
        {phase === 'revealed' && winner && (
          <>
            <p className="draw__for">🎉 Winner of {winner.prizeName} 🎉</p>
            <p className="draw__number draw__number--win">{winner.ticketNumber}</p>
            <p className="draw__name">{winner.displayName}</p>
          </>
        )}
      </div>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <div className="draw__actions">
        {phase === 'revealed' && winner ? (
          <>
            <button className="btn btn--primary btn--big" onClick={() => setPhase('idle')}>
              Next draw
            </button>
            <button className="btn btn--ghost" onClick={() => forfeitAndRedraw(winner)}>
              Not here? Redraw
            </button>
          </>
        ) : (
          <button
            className="btn btn--primary btn--big"
            disabled={!selected || eligible.length === 0 || phase === 'spinning'}
            onClick={() => selected && draw(selected.id)}
          >
            {phase === 'spinning' ? 'Drawing…' : eligible.length === 0 ? 'No tickets left' : 'Draw a winner'}
          </button>
        )}
      </div>

      {winners.length > 0 && (
        <div className="winners">
          <h2>Winners so far</h2>
          <ul>
            {winners.map((w) => (
              <li key={w.id}>
                <span className="mono">#{w.ticketNumber}</span> {w.displayName} — {w.prizeName}
                <button className="btn btn--link" onClick={() => forfeit(w)}>
                  forfeit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
