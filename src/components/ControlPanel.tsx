import { Coins, Eraser, Repeat2, Undo2 } from 'lucide-react'
import { CHIP_VALUES } from '../data/roulette'
import type { ChipValue } from '../types'
import { formatCoins } from '../utils/roulette'

type GameMode = 'auto' | 'manual'

interface ControlPanelProps {
  selectedChip: ChipValue
  totalBet: number
  maxBet: number
  isSpinning: boolean
  isAutoRunning: boolean
  mode: GameMode
  canRepeat: boolean
  onModeChange: (mode: GameMode) => void
  onChipChange: (chip: ChipValue) => void
  onClear: () => void
  onUndo: () => void
  onRepeat: () => void
  onBet: () => void
}

export function ControlPanel({
  selectedChip,
  totalBet,
  maxBet,
  isSpinning,
  isAutoRunning,
  mode,
  canRepeat,
  onModeChange,
  onChipChange,
  onClear,
  onUndo,
  onRepeat,
  onBet,
}: ControlPanelProps) {
  const betDisabled = isAutoRunning ? false : !totalBet || isSpinning || totalBet > maxBet
  const betLabel = isAutoRunning ? (isSpinning ? 'Stop After Spin' : 'Stop Auto') : isSpinning ? 'Spinning' : mode === 'auto' ? 'Start Auto' : 'Bet'

  return (
    <aside className="control-panel">
      <div className="mode-tabs" role="tablist" aria-label="Game mode">
        <button
          aria-selected={mode === 'manual'}
          className={mode === 'manual' ? 'active' : ''}
          disabled={isSpinning || isAutoRunning}
          onClick={() => onModeChange('manual')}
          role="tab"
          type="button"
        >
          Manual
        </button>
        <button
          aria-selected={mode === 'auto'}
          className={mode === 'auto' ? 'active' : ''}
          disabled={isSpinning || isAutoRunning}
          onClick={() => onModeChange('auto')}
          role="tab"
          type="button"
        >
          Auto
        </button>
      </div>

      <section className="stats">
        <div>
          <span>Chip Value</span>
          <strong>
            <Coins size={16} /> {formatCoins(selectedChip)} COINS
          </strong>
        </div>
        <div>
          <span>Bet Amount</span>
          <strong className={totalBet > 0 ? 'coin-gold' : ''}>{formatCoins(totalBet)} COINS</strong>
        </div>
        <div>
          <span>Max Bet</span>
          <strong className="danger">{formatCoins(maxBet)} COINS</strong>
        </div>
      </section>

      <div className="chip-grid" aria-label="Chip values">
        {CHIP_VALUES.map((chip) => (
          <button
            className={chip === selectedChip ? 'chip selected' : 'chip'}
            disabled={isSpinning || isAutoRunning}
            key={chip}
            onClick={() => onChipChange(chip)}
            type="button"
          >
            <span>{formatChip(chip)}</span>
          </button>
        ))}
      </div>

      <section className="action-stack">
        <p>Choose action</p>
        <div className="split-actions">
          <button disabled={!totalBet || isSpinning || isAutoRunning} onClick={onClear} type="button">
            <Eraser size={16} />
            Clear
          </button>
          <button disabled={!totalBet || isSpinning || isAutoRunning} onClick={onUndo} type="button">
            <Undo2 size={16} />
            Undo
          </button>
        </div>
        <button disabled={!canRepeat || isSpinning || isAutoRunning} onClick={onRepeat} type="button">
          <Repeat2 size={16} />
          Repeat Bet
        </button>
      </section>

      <button className={isAutoRunning ? 'bet-button stop-auto' : 'bet-button'} disabled={betDisabled} onClick={onBet} type="button">
        {betLabel}
      </button>
    </aside>
  )
}

function formatChip(value: ChipValue): string {
  if (value >= 1000) return `${value / 1000}K`
  return String(value)
}
