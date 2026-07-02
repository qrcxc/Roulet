import { Gamepad2, Gift, Headphones, Home, LogIn, LogOut, Trophy, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'

interface AppShellProps {
  balance: number
  children: ReactNode
  dailyClaimed: boolean
  userName: string | null
  onDailyClaim: () => void
  onLoginClick: () => void
  onLogout: () => void
  onOpenPanel: (panel: ShellPanel) => void
}

export type ShellPanel = 'home' | 'pointshop' | 'leaderboard' | 'roulette' | 'profile'

const navItems = [
  { id: 'home', label: 'Home Page', icon: Home },
  { id: 'pointshop', label: 'Pointshop', icon: Gift },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'roulette', label: 'Roulette', icon: Gamepad2, active: true },
] satisfies Array<{ id: ShellPanel; label: string; icon: typeof Home; active?: boolean }>

export function AppShell({
  balance,
  children,
  dailyClaimed,
  userName,
  onDailyClaim,
  onLoginClick,
  onLogout,
  onOpenPanel,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand" onClick={() => onOpenPanel('home')} type="button" aria-label="Open The Doctor home">
          <img className="brand-logo" src="/images/doctor-logo.png" alt="" />
          <span>
            <strong>THE DOCTOR</strong>
            <small>Roulette</small>
          </span>
        </button>
        <div className="top-balance">
          <span>Balance</span>
          <strong>{balance.toLocaleString('en-US')} COINS</strong>
        </div>
        {userName ? (
          <div className="user-actions">
            <button className="profile-button" onClick={() => onOpenPanel('profile')} type="button">
              <UserRound size={17} />
              <span>{userName}</span>
            </button>
            <button className="logout-button" onClick={onLogout} type="button" aria-label="Log out">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <button className="login-button" onClick={onLoginClick} type="button">
            <LogIn size={17} />
            Log In
          </button>
        )}
      </header>

      <div className="layout">
        <aside className="sidebar">
          <section className="daily-claimer">
            <div>
              <strong>DAILY</strong>
              <strong>CLAIMER!</strong>
            </div>
            <button onClick={onDailyClaim} type="button">{userName ? (dailyClaimed ? 'Claimed' : 'Claim') : 'Log In'}</button>
          </section>

          <nav aria-label="Landing page">
            {navItems.map(({ id, label, icon: Icon, active }) => (
              <button className={active ? 'active' : ''} onClick={() => onOpenPanel(id)} type="button" key={label}>
                <Icon size={20} />
                <span>{label}</span>
              </button>
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
