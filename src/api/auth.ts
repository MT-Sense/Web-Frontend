import { api } from './client'
import type { CurrentUser } from '@/types/user'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  expiresAt: string
  user: CurrentUser
}

export function login(email: string, password: string) {
  return api.post<AuthResponse>('/api/auth/login', { email, password }, { auth: false })
}

export function refresh(refreshToken: string) {
  return api.post<AuthResponse>('/api/auth/refresh', { refreshToken }, { auth: false })
}

export function logout() {
  return api.post<void>('/api/auth/logout')
}

export function me() {
  return api.get<CurrentUser>('/api/settings/me')
}

export function updateMe(payload: { notifyNewRound?: boolean; notifyMonthlySummary?: boolean }) {
  return api.patch<CurrentUser>('/api/settings/me', payload)
}
