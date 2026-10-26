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

export function updateMe(payload: { fullName?: string; notifyNewRound?: boolean; notifyMonthlySummary?: boolean }) {
  return api.patch<CurrentUser>('/api/settings/me', payload)
}

/** Changes the caller's password. Other sessions are signed out; the response is a fresh
 * session for this device (pass it to the auth store's completeRegistration). */
export function changePassword(currentPassword: string, newPassword: string) {
  return api.post<AuthResponse>('/api/settings/me/password', { currentPassword, newPassword })
}

/** Always succeeds (204), whether or not the email has an account. */
export function forgotPassword(email: string) {
  return api.post<void>('/api/auth/forgot-password', { email }, { auth: false })
}

export function resetPassword(token: string, newPassword: string) {
  return api.post<void>('/api/auth/reset-password', { token, newPassword }, { auth: false })
}
