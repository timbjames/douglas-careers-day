import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { brand } from '../brand'
import { CompanyLogo, SchoolCrest } from './Brand'

/**
 * Full-screen title card: both logos large, plus the role and field, so pupils know what
 * career they're hearing about. Opened at /intro (or from the home page); any click or key
 * closes it and reveals the home page underneath.
 */
export function IntroOverlay() {
  const navigate = useNavigate()

  useEffect(() => {
    const close = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      navigate('/')
    }
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [navigate])

  return (
    <div className="intro" role="dialog" aria-modal="true" aria-label={`${brand.presenter.role}, ${brand.company.name}`} onClick={() => navigate('/')}>
      <div className="intro__logos">
        <CompanyLogo height={120} />
        <span className="intro__x" aria-hidden="true">
          ×
        </span>
        <SchoolCrest height={210} showName={false} />
      </div>

      <div className="intro__text">
        <p className="intro__kicker">Meet a…</p>
        <h1 className="intro__role">{brand.presenter.role}</h1>
        <p className="intro__field">{brand.presenter.field}</p>
      </div>

      <p className="intro__event">
        {brand.company.name} × {brand.school.name} {brand.event.title}
      </p>
      <p className="intro__hint">Click anywhere or press any key to explore</p>
    </div>
  )
}
