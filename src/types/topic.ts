import type { LocalizedText, SentimentSplit } from './common'

/** Single source of truth for the 6 satisfaction dimensions shared by the HR heatmap
 * columns and the Executive radar chart axes — both must stay identical by construction. */
export interface Topic {
  id: string
  label: LocalizedText
}

export interface TopicTrendPoint {
  month: string
  score: number
}

export interface TopicSubIssue {
  id: string
  label: LocalizedText
  percentage: number
}

export interface TopicDrilldown {
  topicId: string
  score: number
  companyAverage: number
  respondentCount: number
  percentageTagged: number
  trend: TopicTrendPoint[]
  subIssues: TopicSubIssue[]
  sentiment: SentimentSplit
  sampleQuotes: string[]
}
