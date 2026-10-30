import { api } from './client'

export interface DepartmentWithCode {
  id: string
  name: string
  joinCode: string
  createdAt: string | null
}

export function list() {
  return api.get<DepartmentWithCode[]>('/api/hr/departments')
}

export interface DepartmentPage {
  items: DepartmentWithCode[]
  total: number
  page: number
  pageSize: number
}

export function listPage(page: number, pageSize: number) {
  const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
  return api.get<DepartmentPage>(`/api/hr/departments?${query.toString()}`)
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
