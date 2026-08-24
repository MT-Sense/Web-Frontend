/** Matches the backend's user_role enum exactly — 'admin' is this app's HR role, renamed to
 * match the given DB schema. The visible badge text still reads "HR" (see i18n role.admin). */
export type Role = 'admin' | 'executive' | 'employee'

export interface CurrentUser {
  id: string
  fullName: string
  role: Role
  department: string
  position: string
  lastLoginAt: string
  notifyNewRound: boolean
  notifyMonthlySummary: boolean
}

export interface Position {
  id: string
  name: string
}
