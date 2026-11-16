import { Link, Route, Routes } from 'react-router'
import { brand } from './brand'
import { CompanyLogo, SchoolCrest } from './components/Brand'
import { StatusBadge } from './components/StatusBadge'
import GamePage from './game/GamePage'
import AdminPage from './pages/admin/AdminPage'
import RafflePage from './pages/RafflePage'
import ScreenPage from './pages/ScreenPage'

function Home() {
  return (
    <main className="home">
      <header className="topbar">
        <CompanyLogo height={44} />
        <SchoolCrest height={52} />
      </header>

      <section className="home__hero">
        <p className="home__kicker">&gt; hello, {brand.school.name}</p>
        <h1 className="home__title">{brand.event.title}</h1>
        <p className="home__sub">{brand.event.tagline}. Enter the free raffle, then see how many bugs you can squash!</p>
        <nav className="home__buttons">
          <Link to="/raffle" className="big-btn big-btn--raffle">
            🎟️ Enter the raffle
          </Link>
          <Link to="/game" className="big-btn big-btn--game">
            🐛 Play Bug Squash
          </Link>
        </nav>
      </section>

      <footer className="home__footer">
        <span>
          {brand.school.motto} · <em>{brand.school.mottoEnglish}</em>
        </span>
        <span className="muted">Built by the {brand.company.name} development team with .NET, React, PostgreSQL and Docker</span>
      </footer>
    </main>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <main className="placeholder">
      <h1>{title}</h1>
      <p>Coming soon…</p>
      <Link to="/" className="back">
        ← Back
      </Link>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/raffle" element={<RafflePage />} />
        <Route path="/game" element={<GamePage />} />
        <Route path="/screen" element={<ScreenPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<ComingSoon title="404 – page not found" />} />
      </Routes>
      <StatusBadge />
    </>
  )
}
