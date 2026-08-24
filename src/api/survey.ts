import { api } from './client'
import type { SurveyPeriod, SubmitResponsePayload, SubmitResponseReceipt, ExtraQuestionDef } from '@/types/survey'

/** The currently open period, if any, and whether the caller already submitted it. */
export function current() {
  return api.get<SurveyPeriod>('/api/surveys/current')
}

export function submit(payload: SubmitResponsePayload) {
  return api.post<SubmitResponseReceipt>('/api/surveys/current/responses', payload)
}

/** The fixed catalog of optional extra questions HR can toggle per round — same list used
 * both by SurveyPeriodsView (choosing what to enable) and SurveyFormView (rendering what's
 * enabled for the open period). */
export function catalog() {
  return api.get<ExtraQuestionDef[]>('/api/survey-questions/catalog')
}
