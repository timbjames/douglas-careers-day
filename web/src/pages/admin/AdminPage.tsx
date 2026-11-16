import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { adminApi, api, ApiError, type AdminApi, type RaffleStats } from '../../api'
import { SoundToggle } from '../../components/SoundToggle'
import { useLiveEvent } from '../../live'
import DrawPanel from './DrawPanel'
import EntriesPanel from './EntriesPanel'
import PrizesPanel from './PrizesPanel'
import ScoresPanel from './ScoresPanel'

const PIN_KEY = 'careersday.adminPin'

// sessionStorage can throw in some browser modes, so treat it as best-effort.
const pinStore = {
  load: () => {
    try {
      return sessionStorage.getItem(PIN_KEY)
    } catch {
      return null
    }
  },
  save: (pin: string) => {
    try {
      sessionStorage.setItem(PIN_KEY, pin)
    } catch {
      /* ignore */
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(PIN_KEY)
    } catch {
      /* ignore */
    }
  },
}

export default function AdminPage() {
  const [pin, setPin] = useState<string | null>(pinStore.load)

  const lock = useCallback(() => {
    pinStore.clear()
    setPin(null)
  }, [])

  const client = useMemo(() => (pin ? adminApi(pin, lock) : null), [pin, lock])

  if (!client)
    return (
      <PinGate
        onUnlock={(p) => {
          pinStore.save(p)
          setPin(p)
        }}
      />
    )

  return <AdminShell client={client} onLock={lock} />
}

function PinGate({ onUnlock }: { onUnlock: (pin: string) => void }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminApi(pin).check()
      onUnlock(pin)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="page">
      <Link to="/" className="back back--top">
        ← Home
      </Link>
      <form className="card pin" onSubmit={submit}>
        <h1>🔐 Admin</h1>
        <label className="field">
          <span>PIN</span>
          <input
            type="password"
            inputMode="numeric"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="btn btn--primary" disabled={busy || pin === ''}>
          Unlock
        </button>
      </form>
    </main>
  )
}

type Tab = 'draw' | 'prizes' | 'entries' | 'scores'

function AdminShell({ client, onLock }: { client: AdminApi; onLock: () => void }) {
  const [tab, setTab] = useState<Tab>('draw')
  const [stats, setStats] = useState<RaffleStats | null>(null)
  // Bumped whenever a panel changes data, so the header stats refresh.
  const [version, setVersion] = useState(0)
  const changed = useCallback(() => setVersion((v) => v + 1), [])

  // New entries from the tablet/phones and changes from other admin tabs show up instantly.
  useLiveEvent('EntryAdded', changed)
  useLiveEvent('RaffleChanged', changed)
  useLiveEvent('WinnerDrawn', changed)
  useLiveEvent('Reconnected', changed)

  useEffect(() => {
    let cancelled = false
    const load = () =>
      api
        .raffleStats()
        .then((s) => !cancelled && setStats(s))
        .catch(() => {})
    load()
    const id = setInterval(load, 30_000) // safety net if the live connection drops
    return () => {
      cancelled = true
      clearInterval(id)
    }
  }, [version])

  return (
    <main className="admin">
      <header className="admin__header">
        <h1>🔐 Raffle admin</h1>
        {stats && (
          <div className="admin__stats">
            <Stat label="Entries" value={stats.entries} />
            <Stat label="Winners" value={stats.winners} />
            <Stat label="Prizes left" value={stats.prizesRemaining} />
          </div>
        )}
        <SoundToggle />
        <button className="btn btn--ghost" onClick={onLock}>
          Lock
        </button>
      </header>

      <nav className="tabs" role="tablist">
        {(['draw', 'prizes', 'entries', 'scores'] as const).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={`tabs__tab ${tab === t ? 'tabs__tab--active' : ''}`}
            onClick={() => setTab(t)}
          >
            {{ draw: '🎉 Draw', prizes: '🎁 Prizes', entries: '🎟️ Entries', scores: '🐛 Scores' }[t]}
          </button>
        ))}
      </nav>

      {tab === 'draw' && <DrawPanel client={client} onChange={changed} goToPrizes={() => setTab('prizes')} />}
      {tab === 'prizes' && <PrizesPanel client={client} onChange={changed} />}
      {tab === 'entries' && <EntriesPanel client={client} onChange={changed} />}
      {tab === 'scores' && <ScoresPanel client={client} />}
    </main>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  )
}
