import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { CurrentUser, Role } from '@/types/user'
import * as authApi from '@/api/auth'
import type { AuthResponse } from '@/api/auth'
import { setAccessToken, setRefreshHandler, setUnauthorizedHandler } from '@/api/client'

const REFRESH_KEY = 'mt-sense-refresh-token'

function homeRouteFor(role: Role): string {
  if (role === 'admin') return '/dashboard'
  if (role === 'executive') return '/executive'
  return '/voices'
}

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(localStorage.getItem(REFRESH_KEY))
  const currentUser = ref<CurrentUser | null>(null)
  let hydratePromise: Promise<void> | null = null

  const currentRole = computed(() => currentUser.value?.role ?? null)
  const isAuthenticated = computed(() => currentUser.value !== null && accessToken.value !== null)

  function persistSession(token: string, refresh: string, user: CurrentUser) {
    accessToken.value = token
    refreshToken.value = refresh
    currentUser.value = user
    localStorage.setItem(REFRESH_KEY, refresh)
    setAccessToken(token)
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    currentUser.value = null
    localStorage.removeItem(REFRESH_KEY)
    setAccessToken(null)
  }

  async function login(email: string, password: string) {
    const res = await authApi.login(email, password)
    persistSession(res.accessToken, res.refreshToken, res.user)
  }

  /** Used by the signup/join-and-register flows, which mint a session the same way login
   * does but via a different endpoint — keeps SignupView/RegisterAccountView from reaching
   * into persistSession directly. */
  function completeRegistration(res: AuthResponse) {
    persistSession(res.accessToken, res.refreshToken, res.user)
  }

  async function logout() {
    try {
      if (accessToken.value) await authApi.logout()
    } finally {
      clearSession()
    }
  }

  /** If a refresh token survived a reload, use it to restore the session. The router guard
   * awaits this on every navigation (see router/guards.ts) — memoized as a single in-flight
   * promise so every caller (not just the first) waits for the *same* completed attempt,
   * rather than a boolean flag that would let a second concurrent caller resolve early while
   * the first attempt's network round-trip is still pending. */
  function hydrate(): Promise<void> {
    if (!hydratePromise) {
      hydratePromise = (async () => {
        if (!refreshToken.value) return
        try {
          const res = await authApi.refresh(refreshToken.value)
          persistSession(res.accessToken, res.refreshToken, res.user)
        } catch {
          clearSession()
        }
      })()
    }
    return hydratePromise
  }

  /** Registered with the API client so a 401 mid-session can transparently refresh once
   * (shared across concurrent requests) before giving up and logging out. */
  setRefreshHandler(async () => {
    if (!refreshToken.value) return false
    try {
      const res = await authApi.refresh(refreshToken.value)
      persistSession(res.accessToken, res.refreshToken, res.user)
      return true
    } catch {
      return false
    }
  })
  setUnauthorizedHandler(() => {
    clearSession()
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  })

  return {
    accessToken,
    currentUser,
    currentRole,
    isAuthenticated,
    login,
    logout,
    hydrate,
    homeRouteFor,
    completeRegistration,
  }
})
