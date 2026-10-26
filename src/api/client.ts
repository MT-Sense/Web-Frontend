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
  details: string[]
  /** The parsed JSON error body, for endpoints that send extra fields (e.g. a `reason`). */
  body: Record<string, unknown>
  constructor(status: number, message: string, details: string[] = [], body: Record<string, unknown> = {}) {
    super(message)
    this.status = status
    this.details = details
    this.body = body
    this.name = 'ApiError'
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  /** Set false for the two public auth endpoints — no bearer token, no refresh-on-401. */
  auth?: boolean
}

async function parseErrorMessage(res: Response): Promise<{ message: string; details: string[]; body: Record<string, unknown> }> {
  try {
    const data = await res.clone().json()
    if (typeof data.error === 'string') return { message: data.error, details: [], body: data }
    if (Array.isArray(data.errors)) {
      const details = data.errors.filter((item: unknown): item is string => typeof item === 'string')
      return { message: details[0] ?? res.statusText, details, body: data }
    }
  } catch {
    // body wasn't JSON — fall through to statusText
  }
  return { message: res.statusText || `request failed with status ${res.status}`, details: [], body: {} }
}

export async function request<T>(path: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const useAuth = options.auth !== false
  const blob = options.body instanceof Blob ? options.body : null
  const headers: Record<string, string> = {
    'Content-Type': blob?.type || (blob ? 'application/octet-stream' : 'application/json'),
  }
  if (useAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body === undefined ? undefined : blob ?? JSON.stringify(options.body),
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
    const parsed = await parseErrorMessage(res)
    throw new ApiError(res.status, parsed.message, parsed.details, parsed.body)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}
