import { api } from './client'
import type { SurveyPeriod, SubmitResponsePayload, SubmitResponseReceipt } from '@/types/survey'

/** The currently open period, if any, and whether the caller already submitted it. */
export function current() {
  return api.get<SurveyPeriod>('/api/surveys/current')
}

export function submit(payload: SubmitResponsePayload) {
  return api.post<SubmitResponseReceipt>('/api/surveys/current/responses', payload)
}
