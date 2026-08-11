import type { LocalizedText } from './common'

export type QuestionType = 'scale5' | 'enps' | 'singleChoice' | 'multiChoice' | 'openText'

export interface SurveyQuestion {
  id: string
  type: QuestionType
  text: LocalizedText
  required: boolean
  metricMapping?: string
  sendToAi?: boolean
  options?: LocalizedText[]
  tagSuggestions?: string[]
  allowPublishOptIn?: boolean
}

export interface SurveyStep {
  id: string
  title: LocalizedText
  estimatedMinutes: number
  questions: SurveyQuestion[]
}

export interface Survey {
  id: string
  title: LocalizedText
  cadence: string
  nextRoundDate: string
  steps: SurveyStep[]
}

export type AnswerValue = string | number | string[]

/** Not linked to CurrentUser — identified only by a random per-submission token. */
export interface SurveyResponse {
  anonymousToken: string
  surveyId: string
  submittedAt: string
  answers: { questionId: string; value: AnswerValue; tags?: string[]; optedInToFeed?: boolean }[]
}
