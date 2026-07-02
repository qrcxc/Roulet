import { Coins, Eraser, Repeat2, Undo2 } from 'lucide-react'
import { CHIP_VALUES } from '../data/roulette'
import type { ChipValue } from '../types'
import { getChipImage, getChipLabel } from '../utils/chips'
import { formatCoins } from '../utils/roulette'

type GameMode = 'auto' | 'manual'

interface ControlPanelProps {
  selectedChip: ChipValue
  totalBet: number
  maxBet: number
  isAuthenticated: boolean
  isSubmitting: boolean
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
  isAuthenticated,
  isSubmitting,
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
  const betDisabled = isAutoRunning ? false : !totalBet || isSubmitting || isSpinning || totalBet > maxBet
  const betLabel = isAutoRunning
    ? isSpinning
      ? 'Stop After Spin'
      : 'Stop Auto'
    : isSubmitting
      ? 'Checking Bet'
      : !isAuthenticated
        ? 'Log In to Bet'
        : isSpinning
          ? 'Spinning'
          : mode === 'auto'
            ? 'Start Auto'
            : 'Bet'

  return (
    <aside className="control-panel">
      <div className="mode-tabs" role="tablist" aria-label="Game mode">
        <button
          aria-selected={mode === 'manual'}
          className={mode === 'manual' ? 'active' : ''}
          disabled={isSubmitting || isSpinning || isAutoRunning}
          onClick={() => onModeChange('manual')}
          role="tab"
          type="button"
        >
          Manual
        </button>
        <button
          aria-selected={mode === 'auto'}
          className={mode === 'auto' ? 'active' : ''}
          disabled={isSubmitting || isSpinning || isAutoRunning}
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
            disabled={isSubmitting || isSpinning || isAutoRunning}
            key={chip}
            onClick={() => onChipChange(chip)}
            type="button"
          >
            <img alt={`${getChipLabel(chip)} chip`} draggable="false" src={getChipImage(chip)} />
          </button>
        ))}
      </div>

      <section className="action-stack">
        <p>Choose action</p>
        <div className="split-actions">
          <button disabled={!totalBet || isSubmitting || isSpinning || isAutoRunning} onClick={onClear} type="button">
            <Eraser size={16} />
            Clear
          </button>
          <button disabled={!totalBet || isSubmitting || isSpinning || isAutoRunning} onClick={onUndo} type="button">
            <Undo2 size={16} />
            Undo
          </button>
        </div>
        <button disabled={!canRepeat || isSubmitting || isSpinning || isAutoRunning} onClick={onRepeat} type="button">
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
