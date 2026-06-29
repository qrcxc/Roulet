import type { BetTarget, ChipValue, LiveBet } from '../types'

export const CHIP_VALUES: ChipValue[] = [1, 5, 25, 50, 250, 500, 2000, 5000, 25000, 50000]

export const RED_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

export const EUROPEAN_WHEEL_ORDER = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18,
  29, 7, 28, 12, 35, 3, 26,
]

export const TABLE_ROWS = [
  [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
  [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
  [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34],
]

export const OUTSIDE_TARGETS: BetTarget[] = [
  { id: 'dozen-FIRST', type: 'dozen', label: '1 to 12', payout: 3, dozen: 'FIRST' },
  { id: 'dozen-SECOND', type: 'dozen', label: '13 to 24', payout: 3, dozen: 'SECOND' },
  { id: 'dozen-THIRD', type: 'dozen', label: '25 to 36', payout: 3, dozen: 'THIRD' },
  { id: 'half-LOW', type: 'half', label: '1 to 18', payout: 2, half: 'LOW' },
  { id: 'parity-EVEN', type: 'parity', label: 'Even', payout: 2, parity: 'EVEN' },
  { id: 'color-RED', type: 'color', label: 'Red', payout: 2, color: 'RED' },
  { id: 'color-BLACK', type: 'color', label: 'Black', payout: 2, color: 'BLACK' },
  { id: 'parity-ODD', type: 'parity', label: 'Odd', payout: 2, parity: 'ODD' },
  { id: 'half-HIGH', type: 'half', label: '19 to 36', payout: 2, half: 'HIGH' },
]

export const COLUMN_TARGETS: BetTarget[] = [
  { id: 'column-TOP', type: 'column', label: '2:1', payout: 3, column: 'TOP' },
  { id: 'column-MIDDLE', type: 'column', label: '2:1', payout: 3, column: 'MIDDLE' },
  { id: 'column-BOTTOM', type: 'column', label: '2:1', payout: 3, column: 'BOTTOM' },
]

export const MOCK_LIVE_BETS: LiveBet[] = [
  { id: '1', user: 'testgmail.com', game: 'Roulette', bet: 25, multiplier: 2, win: 50 },
  { id: '2', user: 'shadowline', game: 'Roulette', bet: 100, multiplier: 0, win: 0 },
  { id: '3', user: 'greenhat', game: 'Roulette', bet: 50, multiplier: 36, win: 1800 },
  { id: '4', user: 'evoplayer', game: 'Roulette', bet: 10, multiplier: 3, win: 30 },
  { id: '5', user: 'testgmail.com', game: 'Roulette', bet: 1, multiplier: 2, win: 2 },
  { id: '6', user: 'coinpilot', game: 'Roulette', bet: 500, multiplier: 2, win: 1000 },
  { id: '7', user: 'noir', game: 'Roulette', bet: 25, multiplier: 0, win: 0 },
  { id: '8', user: 'dailyspin', game: 'Roulette', bet: 5, multiplier: 3, win: 15 },
]
