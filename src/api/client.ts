/** Thin fetch wrapper: base URL from env, attaches the bearer token, retries once through a
 * shared in-flight refresh on 401 (so N concurrent requests hitting an expired token only
 * trigger one refresh call, not N races against a single-use rotating refresh token), and
 * surfaces backend error messages as a typed ApiError. */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8080'

let accessToken: string | null = null
let refreshHandler: (() => Promise<boolean>) | null = null
let unauthorizedHandler: (() => void) | null = null
let refreshInFlight: Promise<boolean> | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

/** Registered once by the auth store: attempts to use the stored refresh token to mint a
 * new session. Returns whether it succeeded. */
export function setRefreshHandler(handler: () => Promise<boolean>) {
  refreshHandler = handler
}

/** Called when refresh fails (or there is nothing to refresh) — the session is unrecoverable. */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

async function ensureRefreshed(): Promise<boolean> {
  if (!refreshHandler) return false
  if (!refreshInFlight) {
    refreshInFlight = refreshHandler().finally(() => {
      refreshInFlight = null
    })
  }
  return refreshInFlight
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Set false for the two public auth endpoints — no bearer token, no refresh-on-401. */
  auth?: boolean
}

async function parseErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.clone().json()
    if (typeof data.error === 'string') return data.error
    if (Array.isArray(data.errors)) return data.errors.join(', ')
  } catch {
    // body wasn't JSON — fall through to statusText
  }
  return res.statusText || `request failed with status ${res.status}`
}

export async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const useAuth = options.auth !== false
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (useAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (res.status === 401 && useAuth && !isRetry) {
    const refreshed = await ensureRefreshed()
    if (refreshed) {
      return request<T>(path, options, true)
    }
    unauthorizedHandler?.()
    throw new ApiError(401, 'session expired')
  }

  if (!res.ok) {
    throw new ApiError(res.status, await parseErrorMessage(res))
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
}
