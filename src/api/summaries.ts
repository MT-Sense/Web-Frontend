import { api } from './client'
import type { LocalizedText } from '@/types/common'
import type { PublishedSummary, SummaryStatus } from './feed'

/** HR-only management of the summaries shown in the employee feed sidebar. Drafts are never
 * returned by the public `/api/summaries` endpoint. */
export interface SaveSummaryPayload {
  periodId?: string
  title: LocalizedText
  body: LocalizedText
  status: SummaryStatus
}

export function list() {
  return api.get<PublishedSummary[]>('/api/hr/summaries')
}

export function create(payload: SaveSummaryPayload) {
  return api.post<PublishedSummary>('/api/hr/summaries', payload)
}

export function update(id: string, payload: SaveSummaryPayload) {
  return api.patch<PublishedSummary>(`/api/hr/summaries/${id}`, payload)
}

export function remove(id: string) {
  return api.delete<void>(`/api/hr/summaries/${id}`)
}
