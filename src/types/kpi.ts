import type { SentimentSplit, Suppressible } from './common'

export interface TrendPoint {
  month: string
  enps: number
  satisfaction: number
}

export interface HrKpis {
  enps: { value: number; deltaVsLastMonth: number }
  satisfaction: { value: number; trend: 'up' | 'down' | 'flat' }
  burnoutRisk: { percentage: number; departmentsAtRisk: number }
  responseRate: { percentage: number; responded: number; total: number }
  sentiment: SentimentSplit
  trend: TrendPoint[]
}

export interface ExecutiveHealth {
  score: number
  sentiment: SentimentSplit
  radar: { topicId: string; thisMonth: number; lastMonth: number }[]
  departmentComparison: { departmentId: string; score: Suppressible<number> }[]
  tenureComparison: { bucket: string; score: number }[]
}
