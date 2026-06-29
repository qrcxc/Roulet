import type { LiveBet, LiveBetTab } from '../types'
import { formatCoins } from '../utils/roulette'

interface LiveBetsProps {
  activeTab: LiveBetTab
  bets: LiveBet[]
  onTabChange: (tab: LiveBetTab) => void
}

const tabs: Array<{ id: LiveBetTab; label: string }> = [
  { id: 'all', label: 'All Bets' },
  { id: 'high-rollers', label: 'High Rollers' },
  { id: 'lucky', label: 'Lucky Bets' },
  { id: 'my', label: 'Your Bets' },
]

export function LiveBets({ activeTab, bets, onTabChange }: LiveBetsProps) {
  return (
    <section className="live-bets">
      <div className="live-tabs" role="tablist" aria-label="Live bets">
        {tabs.map((tab) => (
          <button className={activeTab === tab.id ? 'active' : ''} key={tab.id} onClick={() => onTabChange(tab.id)} type="button">
            {tab.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Game</th>
              <th>Bet</th>
              <th>Multiplier</th>
              <th>Win</th>
            </tr>
          </thead>
          <tbody>
            {bets.map((bet) => (
              <tr key={bet.id}>
                <td>
                  <span className="avatar">{bet.user.slice(0, 1).toUpperCase()}</span>
                  {bet.user}
                </td>
                <td>{bet.game}</td>
                <td>{formatCoins(bet.bet)}</td>
                <td className={bet.multiplier > 0 ? 'positive' : ''}>{bet.multiplier.toFixed(2)}x</td>
                <td>{formatCoins(bet.win)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
