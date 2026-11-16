import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { api, ApiError, type Ticket } from '../api'
import { CompanyLogo } from '../components/Brand'
import { burst } from '../confetti'
import { sound } from '../sound'

export default function RafflePage() {
  const [ticket, setTicket] = useState<Ticket | null>(null)

  return (
    <main className="page raffle">
      <Link to="/" className="back back--top">
        ← Home
      </Link>
      {ticket ? <TicketCard ticket={ticket} onDone={() => setTicket(null)} /> : <EntryForm onEntered={setTicket} />}
    </main>
  )
}

function EntryForm({ onEntered }: { onEntered: (t: Ticket) => void }) {
  const [firstName, setFirstName] = useState('')
  const [initial, setInitial] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const firstRef = useRef<HTMLInputElement>(null)

  useEffect(() => firstRef.current?.focus(), [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    sound.unlock()
    setBusy(true)
    setError(null)
    try {
      onEntered(await api.enterRaffle(firstName, initial))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card raffle__form" onSubmit={submit}>
      <div className="card__brand">
        <CompanyLogo height={28} />
      </div>
      <h1>🎟️ Enter the raffle</h1>
      <p className="muted">It's free! Winners are drawn at the end of the day.</p>

      <label className="field">
        <span>First name</span>
        <input
          ref={firstRef}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          maxLength={20}
          autoComplete="off"
          autoCapitalize="words"
          required
        />
      </label>

      <label className="field field--small">
        <span>
          Surname initial <em>(optional)</em>
        </span>
        <input
          value={initial}
          onChange={(e) => setInitial(e.target.value.replace(/[^\p{L}]/gu, '').slice(0, 1).toUpperCase())}
          maxLength={1}
          autoComplete="off"
        />
      </label>

      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}

      <button className="btn btn--primary btn--big" disabled={busy || firstName.trim() === ''}>
        {busy ? 'Getting your ticket…' : 'Get my ticket'}
      </button>

      <p className="fine-print">We only keep your first name and initial. No surnames, emails or phone numbers.</p>
    </form>
  )
}

/** Shows the ticket with a quick "slot machine" roll-in so it feels like an event. */
function TicketCard({ ticket, onDone }: { ticket: Ticket; onDone: () => void }) {
  const [shown, setShown] = useState('----')

  useEffect(() => {
    let frame = 0
    const id = setInterval(() => {
      frame++
      if (frame >= 14) {
        clearInterval(id)
        setShown(ticket.ticketNumber)
        burst()
        sound.play('ticket')
        return
      }
      // Lock in one more digit every few frames, left to right.
      const locked = Math.floor(frame / 3.5)
      setShown(
        ticket.ticketNumber
          .split('')
          .map((d, i) => (i < locked ? d : String(Math.floor(Math.random() * 10))))
          .join(''),
      )
    }, 70)
    return () => clearInterval(id)
  }, [ticket])

  return (
    <div className="card ticket">
      <div className="card__brand">
        <CompanyLogo height={28} />
      </div>
      <p className="ticket__label">Your ticket number</p>
      <p className="ticket__number" aria-live="polite">
        {shown}
      </p>
      <p className="ticket__name">{ticket.displayName}</p>
      <p className="ticket__hint">
        📸 <strong>Take a photo of this!</strong>
        <br />
        Winners are read out by ticket number at the end of the day.
      </p>
      <button className="btn btn--ghost" onClick={onDone}>
        Enter someone else
      </button>
    </div>
  )
}
