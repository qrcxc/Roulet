import { Gamepad2, Gift, Headphones, Home, LogIn, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppShellProps {
  balance: number
  children: ReactNode
}

const navItems = [
  { label: 'Home Page', icon: Home },
  { label: 'Pointshop', icon: Gift },
  { label: 'Leaderboard', icon: Trophy },
  { label: 'Roulette', icon: Gamepad2, active: true },
]

export function AppShell({ balance, children }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="The Doctor home">
          <span className="brand-cap" />
          <span>
            <strong>THE DOCTOR</strong>
            <small>Roulette</small>
          </span>
        </a>
        <div className="top-balance">
          <span>Balance</span>
          <strong>{balance.toLocaleString('en-US')} COINS</strong>
        </div>
        <button className="login-button" type="button">
          <LogIn size={17} />
          Log In
        </button>
      </header>

      <div className="layout">
        <aside className="sidebar">
          <section className="daily-claimer">
            <div>
              <strong>DAILY</strong>
              <strong>CLAIMER!</strong>
            </div>
            <button type="button">Log In</button>
          </section>

          <nav aria-label="Landing page">
            {navItems.map(({ label, icon: Icon, active }) => (
              <a className={active ? 'active' : ''} href="#" key={label}>
                <Icon size={20} />
                <span>{label}</span>
              </a>
            ))}
          </nav>

          <a className="support-link" href="https://discord.gg/thedoctor" target="_blank" rel="noreferrer">
            <Headphones size={20} />
            Help & Support
          </a>
        </aside>

        <main className="game-area">{children}</main>
      </div>
    </div>
  )
}
