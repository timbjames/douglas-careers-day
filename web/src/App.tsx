import { Link, Route, Routes } from 'react-router'
import { StatusBadge } from './components/StatusBadge'
import AdminPage from './pages/admin/AdminPage'
import RafflePage from './pages/RafflePage'

function Home() {
  return (
    <main className="home">
      <p className="home__kicker">&gt; hello_world.exe</p>
      <h1 className="home__title">
        Careers <span className="accent">Day</span>
      </h1>
      <p className="home__sub">Built with .NET, React, PostgreSQL and Docker.</p>
      <nav className="home__buttons">
        <Link to="/raffle" className="big-btn big-btn--raffle">
          🎟️ Enter the raffle
        </Link>
        <Link to="/game" className="big-btn big-btn--game">
          🐛 Play Bug Squash
        </Link>
      </nav>
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
        <Route path="/game" element={<ComingSoon title="🐛 Bug Squash" />} />
        <Route path="/screen" element={<ComingSoon title="📺 Big screen" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<ComingSoon title="404 – page not found" />} />
      </Routes>
      <StatusBadge />
    </>
  )
}
