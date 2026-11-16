import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { CompanyLogo, SchoolCrest } from '../components/Brand'
import { topics } from './topics'

export default function LearnHub() {
  const navigate = useNavigate()

  // Presenter: → / Page Down / space starts the first topic.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (['ArrowRight', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault()
        navigate(topics[0].path)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])

  return (
    <main className="learn">
      <header className="topbar">
        <Link to="/" aria-label="Home">
          <CompanyLogo height={40} />
        </Link>
        <SchoolCrest height={48} />
      </header>

      <section className="learn__body">
        <div className="learn__heading">
          <p className="home__kicker">&gt; careers_in_tech</p>
          <h1>What’s it really like to work in tech?</h1>
          <p>Pick a topic</p>
        </div>

        <div className="hub">
          {topics.map((t, i) => (
            <Link key={t.path} to={t.path} className="hub__tile">
              <span className="hub__num">0{i + 1}</span>
              <span className="hub__icon" aria-hidden="true">
                {t.icon}
              </span>
              <span className="hub__title">{t.title}</span>
              <span className="hub__blurb">{t.blurb}</span>
            </Link>
          ))}
        </div>
      </section>

      <footer className="learn__nav">
        <Link to="/" className="btn btn--ghost">
          ← Home
        </Link>
        <span className="muted learn__hint">Press → to start</span>
        <Link to={topics[0].path} className="btn btn--primary">
          Start →
        </Link>
      </footer>
    </main>
  )
}
