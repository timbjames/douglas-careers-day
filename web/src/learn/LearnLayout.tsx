import { useEffect, useRef, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { CompanyLogo, SchoolCrest } from '../components/Brand'
import { topics } from './topics'


interface Props {
  title: string
  subtitle?: string
  children: ReactNode
  /**
   * Called on "next" (→, Page Down, space). Return true if the page used it itself, e.g. to reveal
   * the next myth, so the presenter can step through a page with a clicker before moving on.
   */
  onNext?: () => boolean
  onPrev?: () => boolean
}

/** Shared frame for the info pages: brand bar, title, content, and presenter navigation. */
export function LearnLayout({ title, subtitle, children, onNext, onPrev }: Props) {
  const navigate = useNavigate()
  // This page's place in the running order comes from topics.ts, so reordering is a one-line change.
  const { pathname } = useLocation()
  const index = topics.findIndex((t) => t.path === pathname)
  const prev = topics[index - 1]
  const next = topics[index + 1]

  // Keep the latest handlers without re-binding the key listener on every render.
  const handlers = useRef({ onNext, onPrev })
  useEffect(() => {
    handlers.current = { onNext, onPrev }
  })

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return
      // Presentation clickers send Page Down / Page Up; keyboards use arrows and space.
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        if (handlers.current.onNext?.()) return
        navigate(next ? next.path : '/learn')
      } else if (['ArrowLeft', 'PageUp'].includes(e.key)) {
        e.preventDefault()
        if (handlers.current.onPrev?.()) return
        navigate(prev ? prev.path : '/learn')
      } else if (e.key === 'Escape') {
        navigate('/learn')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate, next, prev])

  return (
    <main className="learn">
      <header className="topbar learn__bar">
        <Link to="/learn" className="learn__home" aria-label="All topics">
          <CompanyLogo height={34} />
        </Link>
        <nav className="learn__dots" aria-label="Topics">
          {topics.map((t, i) => (
            <Link key={t.path} to={t.path} className={`learn__dot ${i === index ? 'is-current' : ''}`} title={t.title}>
              <span className="sr-only">{t.title}</span>
            </Link>
          ))}
        </nav>
        <SchoolCrest height={40} />
      </header>

      <section className="learn__body">
        <div className="learn__heading">
          <h1>{title}</h1>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {children}
      </section>

      <footer className="learn__nav">
        <Link to={prev ? prev.path : '/learn'} className="btn btn--ghost">
          ← {prev ? prev.title : 'All topics'}
        </Link>
        <span className="muted learn__hint">Use ← → or a clicker</span>
        <Link to={next ? next.path : '/learn'} className="btn btn--primary">
          {next ? next.title : 'All topics'} →
        </Link>
      </footer>
    </main>
  )
}
