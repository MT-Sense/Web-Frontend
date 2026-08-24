import { api } from './client'
import type { SurveyPeriod } from '@/types/survey'

/** HR-only survey period scheduling — replaces the old Form Builder now that each period is
 * a fixed satisfaction_score + comment_text round rather than an authored form. */
export function list() {
  return api.get<SurveyPeriod[]>('/api/survey-periods')
}

export function create(payload: { month: number; year: number; enabledExtraQuestions: string[] }) {
  return api.post<SurveyPeriod>('/api/survey-periods', payload)
}

export function close(id: string) {
  return api.post<SurveyPeriod>(`/api/survey-periods/${id}/close`)
}
