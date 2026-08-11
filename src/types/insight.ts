import type { ConfidenceLevel, LocalizedText } from './common'

/** All content in this file is mock AI output — replace with real pipeline results in the backend pass. */
export interface AiInsight {
  overallScore: number
  confidence: ConfidenceLevel
  summary: LocalizedText
  issueConfidence: { label: LocalizedText; confidence: number }[]
}

export interface UrgentIssue {
  id: string
  label: LocalizedText
  departmentName: LocalizedText
}

export interface DecisionItem {
  id: string
  rank: number
  label: LocalizedText
  severity: number
}

export interface WordCloudTerm {
  term: LocalizedText
  frequency: number
  topicId: string
}
