import type { SentimentSplit, Suppressible } from './common'
import type { DecisionItem } from './insight'

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

export interface PositionScore {
  positionId: string
  name: string
  score: number
}

export interface ExecutiveHealth {
  score: number
  sentiment: SentimentSplit
  radar: { topicId: string; thisMonth: number; lastMonth: number }[]
  departmentComparison: { departmentId: string; score: Suppressible<number> }[]
  /** Replaces the old tenure-bucket breakdown — the backend schema tracks position, not
   * tenure. Positions below n<5 are simply absent from the list. */
  positionComparison: PositionScore[]
  decisionItems: DecisionItem[]
}
