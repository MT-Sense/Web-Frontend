/** Fixed 2-field survey model, matching the backend's survey_responses schema: one
 * satisfaction score (1-5) plus an optional open comment per period — no more multi-step,
 * multi-question-type forms. HR can additionally toggle on a small fixed catalog of extra
 * questions per round (see ExtraQuestionDef) — still not a form builder, just on/off. */
export interface SurveyPeriod {
  id: string
  month: number
  year: number
  opensAt: string
  closesAt: string
  isOpen: boolean
  alreadySubmitted: boolean
  responseCount: number
  enabledExtraQuestions: string[]
}

export type ExtraQuestionType = 'scale_1_5' | 'enps_0_10'

export interface ExtraQuestionDef {
  key: string
  type: ExtraQuestionType
  label: { th: string; en: string }
}

export interface ExtraQuestionResult {
  key: string
  type: ExtraQuestionType
  label: { th: string; en: string }
  average: number
  respondentCount: number
}

export interface SubmitResponsePayload {
  satisfactionScore: number
  commentText: string
  optedInToFeed: boolean
  tags: string[]
  extraAnswers: Record<string, number>
}

export interface SubmitResponseReceipt {
  submittedAt: string
}
