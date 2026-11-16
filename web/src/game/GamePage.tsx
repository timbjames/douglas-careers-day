import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api, ApiError, type SubmittedScore } from '../api'
import { CompanyLogo } from '../components/Brand'
import { BugIcon } from '../components/Icons'
import { SoundToggle } from '../components/SoundToggle'
import { burst, celebrate } from '../confetti'
import { sound, type SoundName } from '../sound'
import { BugSquashEngine, ROUND_MS, type CritterKind, type Hud, type RoundStats } from './engine'
import { Leaderboard } from './Leaderboard'

type Phase = 'intro' | 'countdown' | 'playing' | 'over'

const squashSounds: Record<CritterKind, SoundName> = {
  bug: 'squash',
  fast: 'squashFast',
  golden: 'golden',
  feature: 'feature',
}

export default function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<BugSquashEngine | null>(null)
  const [phase, setPhase] = useState<Phase>('intro')
  const [countdown, setCountdown] = useState(3)
  const [hud, setHud] = useState<Hud>({ score: 0, timeLeftMs: ROUND_MS, combo: 0, multiplier: 1 })
  const [stats, setStats] = useState<RoundStats | null>(null)
  const [submitted, setSubmitted] = useState<SubmittedScore | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const engine = new BugSquashEngine(canvasRef.current!, {
      onHud: setHud,
      onEnd: (s) => {
        setStats(s)
        setPhase('over')
        sound.play('gameOver')
      },
      onSquash: (kind) => sound.play(squashSounds[kind]),
    })
    engineRef.current = engine
    return () => engine.destroy()
  }, [])

  // 3, 2, 1… then go.
  useEffect(() => {
    if (phase !== 'countdown') return
    sound.play(countdown === 0 ? 'go' : 'countdown')
    const id = setTimeout(
      () => {
        if (countdown === 0) {
          engineRef.current?.start()
          setPhase('playing')
        } else {
          setCountdown((c) => c - 1)
        }
      },
      countdown === 0 ? 400 : 700, // "GO!" shows briefly before the bugs arrive
    )
    return () => clearTimeout(id)
  }, [phase, countdown])

  const play = () => {
    sound.unlock()
    setSubmitted(null)
    setStats(null)
    setHud({ score: 0, timeLeftMs: ROUND_MS, combo: 0, multiplier: 1 })
    setCountdown(3)
    setPhase('countdown')
  }

  const secondsLeft = Math.ceil(hud.timeLeftMs / 1000)

  return (
    <main className="game">
      <div className="game__stage">
        <canvas ref={canvasRef} className="game__canvas" />

        {(phase === 'playing' || phase === 'countdown') && (
          <div className="game__hud">
            <span className="hud__score">{hud.score}</span>
            {hud.multiplier > 1 && <span className="hud__combo">🔥 x{hud.multiplier}</span>}
            <span className={`hud__time ${secondsLeft <= 5 ? 'hud__time--low' : ''}`}>⏱ {secondsLeft}s</span>
            <SoundToggle className="hud__sound" />
          </div>
        )}

        {phase === 'intro' && (
          <div className="game__overlay">
            <Link to="/" className="back back--top">
              ← Home
            </Link>
            <div className="card game__card">
              <div className="card__brand">
                <CompanyLogo height={28} />
              </div>
              <h1 className="title-with-icon">
                <BugIcon /> Bug Squash
              </h1>
              <p>
                The code is crawling with bugs! Developers find and fix bugs every day. You've got 30 seconds to squash
                as many as you can.
              </p>
              <ul className="legend">
                <li>
                  <span className="legend__dot legend__dot--bug" /> Bug <strong>+10</strong>
                </li>
                <li>
                  <span className="legend__dot legend__dot--fast" /> Speedy bug <strong>+20</strong>
                </li>
                <li>
                  <span className="legend__dot legend__dot--golden" /> Golden bug <strong>+50</strong>
                </li>
                <li>
                  <span className="legend__star">✦</span> Feature: <em>don't squash!</em> <strong>−20</strong>
                </li>
              </ul>
              <p className="muted">Squash 5 in a row for a 🔥 combo multiplier!</p>
              <button className="btn btn--primary btn--big" onClick={play}>
                Play
              </button>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="game__overlay game__overlay--clear">
            <span key={countdown} className="countdown">
              {countdown === 0 ? 'GO!' : countdown}
            </span>
          </div>
        )}

        {phase === 'over' && stats && (
          <div className="game__overlay">
            <GameOver
              stats={stats}
              submitted={submitted}
              onSubmitted={(s) => {
                setSubmitted(s)
                setRefreshKey((k) => k + 1)
              }}
              onPlayAgain={play}
            />
          </div>
        )}
      </div>

      <Leaderboard highlightId={submitted?.id} refreshKey={refreshKey} />
    </main>
  )
}

interface GameOverProps {
  stats: RoundStats
  submitted: SubmittedScore | null
  onSubmitted: (s: SubmittedScore) => void
  onPlayAgain: () => void
}

/** How long Play again / Home stay locked after the round ends, so leftover taps can't hit them. */
const END_LOCK_MS = 1500

function GameOver({ stats, submitted, onSubmitted, onPlayAgain }: GameOverProps) {
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [unlocked, setUnlocked] = useState(false)

  useEffect(() => {
    const id = setTimeout(() => setUnlocked(true), END_LOCK_MS)
    return () => clearTimeout(id)
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const result = await api.submitScore(nickname, stats.score)
      onSubmitted(result)
      if (result.rank <= 3) celebrate()
      else burst()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save your score.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="card game__card">
        <h1>⏰ Time's up!</h1>
        <p className="game__final">{stats.score}</p>
        <p className="muted">
          {stats.squashed} bugs squashed · best combo {stats.bestCombo}
          {stats.features > 0 && ` · ${stats.features} feature${stats.features === 1 ? '' : 's'} squashed 😬`}
        </p>

        {submitted ? (
          <p className="game__rank">
            {submitted.rank === 1 ? '👑 New high score! ' : ''}
            You're <strong>#{submitted.rank}</strong> on the leaderboard!
          </p>
        ) : (
          <form className="inline-form" onSubmit={submit}>
            <input
              placeholder="Nickname for the leaderboard"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={16}
              autoComplete="off"
              autoFocus
              aria-label="Nickname"
            />
            <button className="btn btn--primary" disabled={busy || nickname.trim() === ''}>
              Save score
            </button>
          </form>
        )}

        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}

      </div>

      {/* Out of the way in the corner, and locked for a moment, so frantic end-of-round taps
          don't accidentally start a new game. */}
      <div
        className={`game__end-actions ${unlocked ? '' : 'is-locked'}`}
        style={{ ['--lock-ms' as string]: `${END_LOCK_MS}ms` }}
      >
        <Link
          to="/"
          className="btn btn--ghost"
          aria-disabled={!unlocked}
          tabIndex={unlocked ? undefined : -1}
          onClick={(e) => !unlocked && e.preventDefault()}
        >
          Home
        </Link>
        <button className="btn btn--primary btn--big game__again" disabled={!unlocked} onClick={onPlayAgain}>
          Play again
        </button>
      </div>
    </>
  )
}
