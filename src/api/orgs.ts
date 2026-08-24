import { api } from './client'
import type { AuthResponse } from './auth'

export interface SignupPayload {
  companyName: string
  companySlug?: string
  adminFullName: string
  adminEmail: string
  adminPassword: string
}

export interface SignupResponse extends AuthResponse {
  joinCode: string
}

export interface JoinCodeOption {
  id: string
  name: string
}

export interface JoinCodeCheckResult {
  valid: boolean
  companyName?: string
  requiresCompanyPassword: boolean
  collectDepartment: boolean
  collectTenure: boolean
  departments?: JoinCodeOption[]
}

export interface RegisterEmployeePayload {
  code: string
  companyPassword?: string
  firstName: string
  lastName: string
  position: string
  email: string
  password: string
  departmentId?: string
  tenureBucket?: string
}

export interface OrgSettings {
  companyPasswordSet: boolean
  collectDepartment: boolean
  collectTenure: boolean
}

export interface UpdateOrgSettingsPayload {
  companyPassword?: string
  collectDepartment?: boolean
  collectTenure?: boolean
}

export function signup(payload: SignupPayload) {
  return api.post<SignupResponse>('/api/onboarding/signup', payload, { auth: false })
}

export function checkJoinCode(code: string) {
  return api.post<JoinCodeCheckResult>('/api/onboarding/join/check', { code }, { auth: false })
}

export function verifyCompanyPassword(code: string, companyPassword: string) {
  return api.post<{ valid: boolean }>(
    '/api/onboarding/join/verify-password',
    { code, companyPassword },
    { auth: false },
  )
}

export function registerEmployee(payload: RegisterEmployeePayload) {
  return api.post<AuthResponse>('/api/onboarding/join/register', payload, { auth: false })
}

export function getJoinCode() {
  return api.get<{ joinCode: string }>('/api/org/join-code')
}

export function regenerateJoinCode() {
  return api.post<{ joinCode: string }>('/api/org/join-code/regenerate')
}

export function getOrgSettings() {
  return api.get<OrgSettings>('/api/org/settings')
}

export function updateOrgSettings(payload: UpdateOrgSettingsPayload) {
  return api.patch<OrgSettings>('/api/org/settings', payload)
}
