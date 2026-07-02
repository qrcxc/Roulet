import { MOCK_LIVE_BETS } from '../data/roulette'
import type { LiveBet, LiveBetTab, RouletteBetRequestDto } from '../types'
import { ApiRequestError, apiSession, requestApi } from './client'

const BET_API_TIMEOUT_MS = 1400

interface LoginResponse {
  token?: string
  accessToken?: string
  access_token?: string
  user?: {
    email?: string
    username?: string
    name?: string
  }
  email?: string
  username?: string
  name?: string
}

export interface LoginResult {
  token: string
  username: string
  offline: boolean
}

export async function getRouletteConfig(): Promise<unknown> {
  return requestApi('/games/house/roulette/config')
}

export async function loginPlayer(identifier: string, password: string): Promise<LoginResult> {
  const username = identifier.trim()

  if (!username || !password.trim()) {
    throw new Error('Enter login and password')
  }

  try {
    const data = await requestApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: username,
        username,
        password,
      }),
    })

    const token = data.token || data.accessToken || data.access_token
    const displayName = data.user?.username || data.user?.email || data.user?.name || data.username || data.email || data.name || username

    if (!token) {
      throw new Error('Login response did not include an access token')
    }

    apiSession.setToken(token)
    apiSession.setUserName(displayName)

    return {
      token,
      username: displayName,
      offline: false,
    }
  } catch (error) {
    if (error instanceof ApiRequestError && error.status && error.status < 500 && error.status !== 404) {
      throw error
    }

    const token = createLocalToken(username)
    apiSession.setToken(token)
    apiSession.setUserName(username)

    return {
      token,
      username,
      offline: true,
    }
  }
}

export async function placeRouletteBet(payload: RouletteBetRequestDto): Promise<unknown> {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), BET_API_TIMEOUT_MS)

  try {
    return await requestApi('/games/house/roulette/bet', {
      method: 'POST',
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch (error) {
    return {
      accepted: true,
      offline: true,
      payload,
      reason: error instanceof Error ? error.message : 'API unavailable',
    }
  } finally {
    window.clearTimeout(timeoutId)
  }
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

function createLocalToken(username: string): string {
  const seed = `${username}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  return `local-${btoa(encodeURIComponent(seed)).replace(/=+$/g, '')}`
}
