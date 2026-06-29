import { COLUMN_TARGETS, OUTSIDE_TARGETS, TABLE_ROWS } from '../data/roulette'
import type { BetTarget, PlacedBet } from '../types'
import { formatCoins, getNumberColor, getStraightTarget } from '../utils/roulette'

interface RouletteTableProps {
  betMap: Map<string, PlacedBet>
  disabled: boolean
  winningNumber: number | null
  onTarget: (target: BetTarget) => void
}

export function RouletteTable({ betMap, disabled, winningNumber, onTarget }: RouletteTableProps) {
  return (
    <section className="roulette-table" aria-label="Roulette table">
      <button
        className={cellClass(0, winningNumber)}
        disabled={disabled}
        onClick={() => onTarget(getStraightTarget(0))}
        type="button"
      >
        <span>0</span>
        <BetBadge bet={betMap.get('straight-0')} />
      </button>

      <div className="number-grid">
        {TABLE_ROWS.map((row, rowIndex) => (
          <div className="table-row" key={row.join('-')}>
            {row.map((number) => (
              <button
                className={cellClass(number, winningNumber)}
                disabled={disabled}
                key={number}
                onClick={() => onTarget(getStraightTarget(number))}
                type="button"
              >
                <span>{number}</span>
                <BetBadge bet={betMap.get(`straight-${number}`)} />
              </button>
            ))}
            <button
              className="roulette-cell outside"
              disabled={disabled}
              onClick={() => onTarget(COLUMN_TARGETS[rowIndex])}
              type="button"
            >
              <span>2:1</span>
              <BetBadge bet={betMap.get(COLUMN_TARGETS[rowIndex].id)} />
            </button>
          </div>
        ))}
      </div>

      <div className="dozen-row">
        {OUTSIDE_TARGETS.slice(0, 3).map((target) => (
          <button className="roulette-cell outside" disabled={disabled} key={target.id} onClick={() => onTarget(target)} type="button">
            <span>{target.label}</span>
            <BetBadge bet={betMap.get(target.id)} />
          </button>
        ))}
      </div>

      <div className="outside-row">
        {OUTSIDE_TARGETS.slice(3).map((target) => (
          <button
            className={`roulette-cell outside ${target.type === 'color' ? target.color?.toLowerCase() : ''}`}
            disabled={disabled}
            key={target.id}
            onClick={() => onTarget(target)}
            type="button"
            aria-label={target.label}
          >
            <span>{target.type === 'color' ? '' : target.label}</span>
            <BetBadge bet={betMap.get(target.id)} />
          </button>
        ))}
      </div>
    </section>
  )
}

function cellClass(number: number, winningNumber: number | null): string {
  const color = getNumberColor(number)
  const winner = winningNumber === number ? ' winner' : ''
  return `roulette-cell number ${color}${winner}`
}

function BetBadge({ bet }: { bet?: PlacedBet }) {
  if (!bet) return null

  return <i className="bet-badge">{formatCoins(bet.amount)}</i>
}
