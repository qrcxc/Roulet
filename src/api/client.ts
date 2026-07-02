const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.thedoctor-dev.com'
const TOKEN_KEY = 'roulette.accessToken'
const USER_KEY = 'roulette.userName'

export class ApiRequestError extends Error {
  status?: number
  details?: unknown
}

export const apiSession = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string | null) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
  },
  getUserName() {
    return localStorage.getItem(USER_KEY)
  },
  setUserName(username: string | null) {
    if (username) {
      localStorage.setItem(USER_KEY, username)
    } else {
      localStorage.removeItem(USER_KEY)
    }
  },
  clear() {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  },
}

export async function requestApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  const token = apiSession.getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  })

  const rawBody = await response.text()
  const body = parseJson(rawBody)

  if (!response.ok) {
    const error = new ApiRequestError(getResponseMessage(body, response.status))
    error.status = response.status
    error.details = body
    throw error
  }

  return (body ?? {}) as T
}

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) return error.message
  if (error instanceof Error) return error.message
  return 'API request failed'
}

function parseJson(value: string): unknown {
  if (!value) return null

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function getResponseMessage(body: unknown, status: number): string {
  if (body && typeof body === 'object') {
    const source = body as Record<string, unknown>
    const message = source.message || source.error

    if (Array.isArray(message)) return message.join(', ')
    if (typeof message === 'string') return message
  }

  return `API request failed: ${status}`
}
