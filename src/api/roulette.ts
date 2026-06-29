import { MOCK_LIVE_BETS } from '../data/roulette'
import type { LiveBet, LiveBetTab, RouletteBetRequestDto } from '../types'
import { requestApi } from './client'

export async function getRouletteConfig(): Promise<unknown> {
  return requestApi('/games/house/roulette/config')
}

export async function placeRouletteBet(payload: RouletteBetRequestDto): Promise<unknown> {
  return requestApi('/games/house/roulette/bet', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function getLatestBets(tab: LiveBetTab): Promise<LiveBet[]> {
  const path = tab === 'all' ? '/bets/latest' : `/bets/latest/${tab}`

  try {
    const data = await requestApi<unknown>(path)
    const items = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items : []
    const normalized = items.map(normalizeLiveBet).filter(Boolean) as LiveBet[]
    return normalized.length ? normalized : MOCK_LIVE_BETS
  } catch {
    return MOCK_LIVE_BETS
  }
}

export async function getTransactionsHistory(params: { page?: number; take?: number; search?: string } = {}) {
  const searchParams = new URLSearchParams()
  if (params.page) searchParams.set('page', String(params.page))
  if (params.take) searchParams.set('take', String(params.take))
  if (params.search) searchParams.set('search', params.search)

  const suffix = searchParams.toString() ? `?${searchParams.toString()}` : ''
  return requestApi(`/admin/balance/history${suffix}`)
}

function normalizeLiveBet(data: unknown): LiveBet | null {
  if (!data || typeof data !== 'object') return null

  const source = data as Record<string, unknown>
  const user = (source.user || source.player || {}) as Record<string, unknown>
  const username = String(user.email || user.username || source.username || source.email || 'testgmail.com')
  const bet = Number(source.bet || source.amount || source.betAmount || 1)
  const multiplier = Number(source.multiplier || source.payoutMultiplier || 0)
  const win = Number(source.win || source.payout || source.profit || bet * multiplier)

  return {
    id: String(source.id || source.betId || crypto.randomUUID()),
    user: username,
    avatar: typeof user.avatarUrl === 'string' ? user.avatarUrl : undefined,
    game: String(source.game || source.gameName || 'Roulette'),
    bet,
    multiplier,
    win,
  }
}
