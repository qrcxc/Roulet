import { RED_NUMBERS, TABLE_ROWS } from '../data/roulette'
import type { BetAction, BetTarget, PlacedBet, RouletteBetRequestDto, SpinResult } from '../types'

export function formatCoins(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: value >= 100 ? 0 : 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value)
}

export function getNumberColor(number: number): 'green' | 'red' | 'black' {
  if (number === 0) return 'green'
  return RED_NUMBERS.has(number) ? 'red' : 'black'
}

export function getStraightTarget(number: number): BetTarget {
  return {
    id: `straight-${number}`,
    type: 'straight',
    label: String(number),
    payout: 36,
    number,
  }
}

export function getBetMap(actions: BetAction[]): Map<string, PlacedBet> {
  return actions.reduce((map, action) => {
    const previous = map.get(action.target.id)
    map.set(action.target.id, {
      target: action.target,
      amount: (previous?.amount ?? 0) + action.amount,
    })
    return map
  }, new Map<string, PlacedBet>())
}

export function toPlacedBets(actions: BetAction[]): PlacedBet[] {
  return Array.from(getBetMap(actions).values())
}

export function getTotalBet(actions: BetAction[]): number {
  return actions.reduce((sum, action) => sum + action.amount, 0)
}

export function isBetWinner(target: BetTarget, number: number): boolean {
  if (target.type === 'straight') return target.number === number
  if (number === 0) return false

  if (target.type === 'color') {
    return target.color?.toLowerCase() === getNumberColor(number)
  }

  if (target.type === 'parity') {
    return target.parity === (number % 2 === 0 ? 'EVEN' : 'ODD')
  }

  if (target.type === 'half') {
    return target.half === (number <= 18 ? 'LOW' : 'HIGH')
  }

  if (target.type === 'dozen') {
    const dozen = number <= 12 ? 'FIRST' : number <= 24 ? 'SECOND' : 'THIRD'
    return target.dozen === dozen
  }

  if (target.type === 'column') {
    const rowIndex = TABLE_ROWS.findIndex((row) => row.includes(number))
    const column = rowIndex === 0 ? 'TOP' : rowIndex === 1 ? 'MIDDLE' : 'BOTTOM'
    return target.column === column
  }

  return false
}

export function resolveSpin(actions: BetAction[], number: number): SpinResult {
  const bets = toPlacedBets(actions)
  const totalBet = getTotalBet(actions)
  const payout = bets.reduce((sum, bet) => {
    return isBetWinner(bet.target, number) ? sum + bet.amount * bet.target.payout : sum
  }, 0)

  return {
    id: crypto.randomUUID(),
    number,
    color: getNumberColor(number),
    totalBet,
    payout,
    multiplier: totalBet > 0 ? payout / totalBet : 0,
    createdAt: new Date().toISOString(),
    bets,
  }
}

export function buildRouletteBetRequest(bets: PlacedBet[]): RouletteBetRequestDto {
  const request: RouletteBetRequestDto = { params: {} }

  for (const bet of bets) {
    const amount = bet.amount.toFixed(2)

    if (bet.target.type === 'straight' && bet.target.number !== undefined) {
      request.params.straightValues ??= []
      request.params.straightValues.push({ straightNumber: bet.target.number, amount })
    }

    if (bet.target.type === 'color' && bet.target.color) {
      request.params.colorValues ??= []
      request.params.colorValues.push({ color: bet.target.color, amount })
    }

    if (bet.target.type === 'parity' && bet.target.parity) {
      request.params.parityValues ??= []
      request.params.parityValues.push({ parity: bet.target.parity, amount })
    }

    if (bet.target.type === 'half' && bet.target.half) {
      request.params.halfValues ??= []
      request.params.halfValues.push({ half: bet.target.half, amount })
    }

    if (bet.target.type === 'dozen' && bet.target.dozen) {
      request.params.dozenValues ??= []
      request.params.dozenValues.push({ dozen: bet.target.dozen, amount })
    }

    if (bet.target.type === 'column' && bet.target.column) {
      request.params.columnValues ??= []
      request.params.columnValues.push({ column: bet.target.column, amount })
    }
  }

  return request
}

export function randomRouletteNumber(): number {
  return Math.floor(Math.random() * 37)
}
