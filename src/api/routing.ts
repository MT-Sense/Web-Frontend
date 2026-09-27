import { api } from './client'

export interface Rule {
  id: string
  topic: string
  keywords: string[]
  departmentId: string
  enabled: boolean
}

export interface Policy {
  version: number
  rules: Rule[]
}

export interface Case {
  id: string
  title: string
  summary: string
  topic: string
  departmentId: string
  status: string
  version: number
  matchReason: string
  history: {
    at: string
    actor: string
    action: string
    note: string
    topic: string
    departmentId: string
  }[]
}

const root = '/api/hr/automation'

export function policy() {
  return api.get<Policy>(`${root}/routing-policy`)
}

export function savePolicy(currentPolicy: Policy) {
  return api.patch<Policy>(`${root}/routing-policy`, currentPolicy)
}

export function cases() {
  return api.get<Case[]>(`${root}/cases`)
}

export function create(title: string, summary: string) {
  return api.post<Case>(`${root}/cases`, { title, summary })
}

export function update(
  caseItem: Case,
  action: string,
  topic: string,
  departmentId: string,
  note: string,
) {
  return api.post<Case>(`${root}/cases/${caseItem.id}`, {
    version: caseItem.version,
    action,
    topic,
    departmentId,
    note,
  })
}
