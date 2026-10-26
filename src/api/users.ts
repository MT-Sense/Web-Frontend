import { api } from './client'
import type { Role } from '@/types/user'

/** HR's view of an account: profile and access only. There is deliberately no survey
 * information here (who answered, or what). */
export interface ManagedUser {
  id: string
  fullName: string
  email: string
  role: Role
  departmentId: string
  departmentName: string
  positionId: string
  positionName: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export interface CreateUserPayload {
  fullName: string
  email: string
  role: Role
  departmentId: string
  /** Free text; a new position is created when the name does not exist yet. */
  position: string
  /** Temporary password HR passes on to the person. */
  password: string
}

/** Omitted fields are unchanged; "" clears departmentId / position. */
export type UpdateUserPayload = Partial<Omit<CreateUserPayload, 'password'>> & { isActive?: boolean }

export function list() {
  return api.get<ManagedUser[]>('/api/hr/users')
}

export function create(payload: CreateUserPayload) {
  return api.post<ManagedUser>('/api/hr/users', payload)
}

export function update(id: string, payload: UpdateUserPayload) {
  return api.patch<ManagedUser>(`/api/hr/users/${id}`, payload)
}

export function setPassword(id: string, password: string) {
  return api.post<void>(`/api/hr/users/${id}/password`, { password })
}

export function sendResetEmail(id: string) {
  return api.post<{ sentTo: string; smtpConfigured: boolean }>(`/api/hr/users/${id}/password-reset-email`)
}
