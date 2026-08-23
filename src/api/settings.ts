import { api } from './client'
import type { PeriodSubmissionStatus } from '@/types/auditLog'

export function submissionHistory() {
  return api.get<PeriodSubmissionStatus[]>('/api/settings/me/submissions')
}
