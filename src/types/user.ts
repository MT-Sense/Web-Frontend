export type Role = 'HR' | 'Executive' | 'Employee'

export interface CurrentUser {
  id: string
  fullName: string
  role: Role
  department: string
  lastLoginAt: string
  notifyNewRound: boolean
  notifyMonthlySummary: boolean
}
