import { api } from './client'

export interface DepartmentWithCode {
  id: string
  name: string
  joinCode: string
}

export function list() {
  return api.get<DepartmentWithCode[]>('/api/hr/departments')
}

export function create(name: string) {
  return api.post<DepartmentWithCode>('/api/hr/departments', { name })
}

export function update(id: string, name: string) {
  return api.patch<DepartmentWithCode>(`/api/hr/departments/${encodeURIComponent(id)}`, { name })
}

export function remove(id: string) {
  return api.delete<void>(`/api/hr/departments/${encodeURIComponent(id)}`)
}
