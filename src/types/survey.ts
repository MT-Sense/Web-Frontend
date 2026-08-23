/** Fixed 2-field survey model, matching the backend's survey_responses schema: one
 * satisfaction score (1-5) plus an optional open comment per period — no more multi-step,
 * multi-question-type forms. */
export interface SurveyPeriod {
  id: string
  month: number
  year: number
  opensAt: string
  closesAt: string
  isOpen: boolean
  alreadySubmitted: boolean
  responseCount: number
}

export interface SubmitResponsePayload {
  satisfactionScore: number
  commentText: string
  optedInToFeed: boolean
  tags: string[]
}

export interface SubmitResponseReceipt {
  submittedAt: string
}
