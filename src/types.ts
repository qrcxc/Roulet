export type ChipValue = 1 | 5 | 25 | 50 | 250 | 500 | 2000 | 5000 | 25000 | 50000

export type BetTargetType = 'straight' | 'color' | 'parity' | 'half' | 'dozen' | 'column'

export type RouletteColor = 'RED' | 'BLACK'
export type RouletteParity = 'ODD' | 'EVEN'
export type RouletteHalf = 'LOW' | 'HIGH'
export type RouletteDozen = 'FIRST' | 'SECOND' | 'THIRD'
export type RouletteColumn = 'TOP' | 'MIDDLE' | 'BOTTOM'

export interface BetTarget {
  id: string
  type: BetTargetType
  label: string
  payout: number
  color?: RouletteColor
  parity?: RouletteParity
  half?: RouletteHalf
  dozen?: RouletteDozen
  column?: RouletteColumn
  number?: number
}

export interface PlacedBet {
  target: BetTarget
  amount: number
}

export interface BetAction {
  target: BetTarget
  amount: number
  createdAt: number
}

export interface SpinResult {
  id: string
  number: number
  color: 'green' | 'red' | 'black'
  totalBet: number
  payout: number
  multiplier: number
  createdAt: string
  bets: PlacedBet[]
}

export interface LiveBet {
  id: string
  user: string
  avatar?: string
  game: string
  bet: number
  multiplier: number
  win: number
}

export interface RouletteBetParams {
  halfValues?: Array<{ amount: string; half: RouletteHalf }>
  parityValues?: Array<{ amount: string; parity: RouletteParity }>
  colorValues?: Array<{ amount: string; color: RouletteColor }>
  columnValues?: Array<{ amount: string; column: RouletteColumn }>
  dozenValues?: Array<{ amount: string; dozen: RouletteDozen }>
  straightValues?: Array<{ straightNumber: number; amount: string }>
}

export interface RouletteBetRequestDto {
  params: RouletteBetParams
}

export type LiveBetTab = 'all' | 'high-rollers' | 'lucky' | 'my'
