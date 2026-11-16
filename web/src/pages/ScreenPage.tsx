import QRCode from 'qrcode'
import { useCallback, useEffect, useRef, useState } from 'react'
import { api, type PublicPrize, type RaffleStats, type Winner } from '../api'
import { SoundToggle } from '../components/SoundToggle'
import { burst, celebrate } from '../confetti'
import { Leaderboard } from '../game/Leaderboard'
import { useLiveEvent, useLiveStatus, type LiveEvents } from '../live'
import { sound } from '../sound'

/**
 * Big-screen display for the stand: how to join, live raffle count, prizes, winners,
 * the Bug Squash leaderboard and a feed of what's happening. Winners drawn from /admin
 * take over the whole screen with a drum-roll reveal.
 */
export default function ScreenPage() {
  const [stats, setStats] = useState<RaffleStats | null>(null)
  const [prizes, setPrizes] = useState<PublicPrize[]>([])
  const [winners, setWinners] = useState<Winner[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [drawQueue, setDrawQueue] = useState<LiveEvents['WinnerDrawn'][]>([])
  const [soundHint, setSoundHint] = useState(true)
  const live = useLiveStatus()

  const loadRaffle = useCallback(() => {
    api.raffleStats().then(setStats).catch(() => {})
    api.prizes().then(setPrizes).catch(() => {})
    api.winners().then(setWinners).catch(() => {})
  }, [])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set once the requests resolve
    loadRaffle()
    const id = setInterval(loadRaffle, 30_000) // safety net if the live connection drops
    return () => clearInterval(id)
  }, [loadRaffle])

  const addToFeed = (item: Omit<FeedItem, 'id'>) =>
    setFeed((f) => [{ ...item, id: crypto.randomUUID() }, ...f].slice(0, 6))

  useLiveEvent('EntryAdded', (e) => {
    setStats((s) => (s ? { ...s, entries: e.entries } : s))
    addToFeed({ icon: '🎟️', text: `${e.displayName} entered the raffle` })
  })

  useLiveEvent('ScoreAdded', (e) => {
    const top = e.rank === 1
    addToFeed({
      icon: top ? '👑' : '🐛',
      text: top ? `${e.nickname} set a new high score: ${e.score}!` : `${e.nickname} squashed ${e.score} points (#${e.rank})`,
      highlight: top,
    })
    if (top) {
      burst()
      sound.play('golden')
    }
  })

  useLiveEvent('WinnerDrawn', (e) => setDrawQueue((q) => [...q, e]))
  useLiveEvent('RaffleChanged', loadRaffle)
  useLiveEvent('Reconnected', loadRaffle)

  // Browsers only allow sound after an interaction, so the first click/tap anywhere unlocks it.
  useEffect(() => {
    const unlock = () => {
      sound.unlock()
      setSoundHint(false)
    }
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  const current = drawQueue[0]

  return (
    <main className="screen">
      <header className="screen__header">
        <h1>
          Careers <span className="accent">Day</span>
        </h1>
        <span className={`screen__live screen__live--${live}`}>{live === 'connected' ? '● LIVE' : '○ reconnecting…'}</span>
        {soundHint && <span className="screen__hint">Click anywhere to turn on sound</span>}
        <SoundToggle />
      </header>

      <section className="screen__col screen__join">
        <JoinQr />
        <div className="screen__count">
          <span key={stats?.entries} className="screen__count-value">
            {stats?.entries ?? '–'}
          </span>
          <span className="screen__count-label">raffle entries so far</span>
        </div>
      </section>

      <section className="screen__col screen__raffle">
        <h2>🎁 Up for grabs</h2>
        {prizes.length === 0 ? (
          <p className="muted">Prizes coming soon…</p>
        ) : (
          <ul className="screen__prizes">
            {prizes.map((p) => (
              <li key={p.name} className={p.remaining === 0 ? 'is-gone' : undefined}>
                <span>{p.name}</span>
                <span className="screen__prize-left">{p.remaining === 0 ? 'won!' : `×${p.remaining}`}</span>
              </li>
            ))}
          </ul>
        )}

        {winners.length > 0 && (
          <>
            <h2>🏆 Winners</h2>
            <ul className="screen__winners">
              {winners.map((w) => (
                <li key={w.id}>
                  <span className="mono">#{w.ticketNumber}</span>
                  <span>{w.displayName}</span>
                  <span className="muted">{w.prizeName}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <Leaderboard className="screen__col screen__board" title="🐛 Bug Squash top 10" />

      <footer className="screen__feed">
        {feed.length === 0 ? (
          <span className="muted">Scan the code to enter the raffle and play Bug Squash!</span>
        ) : (
          feed.map((f) => (
            <span key={f.id} className={`feed-item ${f.highlight ? 'feed-item--highlight' : ''}`}>
              {f.icon} {f.text}
            </span>
          ))
        )}
      </footer>

      {current && (
        <WinnerTakeover
          key={`${current.ticketNumber}-${drawQueue.length}`}
          winner={current}
          onDone={() => {
            setDrawQueue((q) => q.slice(1))
            loadRaffle()
          }}
        />
      )}
    </main>
  )
}

interface FeedItem {
  id: string
  icon: string
  text: string
  highlight?: boolean
}

/** QR code for phones. Uses PUBLIC_URL from the server, falling back to this page's address. */
function JoinQr() {
  const [url, setUrl] = useState<string | null>(null)
  const [qr, setQr] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .config()
      .catch(() => ({ publicUrl: null }))
      .then(({ publicUrl }) => {
        const target = publicUrl || window.location.origin
        if (cancelled) return
        setUrl(target)
        return QRCode.toDataURL(target, { margin: 1, width: 480, color: { dark: '#0b1020', light: '#ffffff' } })
      })
      .then((data) => !cancelled && data && setQr(data))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const isLocal = url ? /\/\/(localhost|127\.|\[::1\])/.test(url) : false

  return (
    <div className="screen__qr">
      <h2>📱 Scan to play &amp; win</h2>
      {qr ? <img src={qr} alt={`QR code for ${url}`} /> : <div className="screen__qr-placeholder" />}
      <p className="screen__url mono">{url?.replace(/^https?:\/\//, '')}</p>
      {isLocal && <p className="screen__warn">Set PUBLIC_URL so phones can reach this</p>}
    </div>
  )
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Full-screen drum-roll: spinning numbers that slow down and land on the winning ticket. */
function WinnerTakeover({ winner, onDone }: { winner: LiveEvents['WinnerDrawn']; onDone: () => void }) {
  const [display, setDisplay] = useState('????')
  const [revealed, setRevealed] = useState(false)
  const done = useRef(onDone)
  useEffect(() => {
    done.current = onDone
  })

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Same pacing as the admin page, so both reveal at about the same moment.
      for (let delay = 40; delay < 450 && !cancelled; delay *= 1.1) {
        setDisplay(String(1000 + Math.floor(Math.random() * 9000)))
        sound.play('tick')
        await sleep(delay)
      }
      if (cancelled) return
      setDisplay(winner.ticketNumber)
      setRevealed(true)
      celebrate()
      sound.play('fanfare')
      await sleep(12_000)
      if (!cancelled) done.current()
    })()
    return () => {
      cancelled = true
    }
  }, [winner])

  return (
    <div className="takeover" role="dialog" aria-live="assertive">
      <p className="takeover__for">{revealed ? `🎉 ${winner.prizeName} goes to… 🎉` : `🥁 Drawing for ${winner.prizeName}…`}</p>
      <p className={`takeover__number ${revealed ? 'takeover__number--win' : ''}`}>{display}</p>
      {revealed && (
        <>
          <p className="takeover__name">{winner.displayName}</p>
          <p className="takeover__hint">Come and show us your ticket!</p>
        </>
      )}
    </div>
  )
}
