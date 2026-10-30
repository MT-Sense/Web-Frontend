import type { SentimentSplit, Suppressible } from './common'
import type { DecisionItem } from './insight'

export interface TrendPoint {
  month: string
  enps: number | null
  satisfaction: number | null
  responseRate: number | null
  burnoutRisk: number | null
  hasResponses: boolean
}

export interface HrKpis {
  dataState: 'empty' | 'suppressed' | 'available'
  enps: { value: number | null; deltaVsLastMonth: number | null }
  satisfaction: { value: number | null; trend: 'up' | 'down' | 'flat' | null }
  burnoutRisk: { percentage: number | null; departmentsAtRisk: number | null }
  responseRate: { percentage: number | null; responded: number | null; total: number | null }
  sentiment: SentimentSplit | null
  trend: TrendPoint[]
}

export interface PositionScore {
  positionId: string
  name: string
  score: number
}

export interface ExecutiveHealth {
  score: number | null
  sentiment: SentimentSplit | null
  radar: { topicId: string; thisMonth: number | null; lastMonth: number | null }[]
  departmentComparison: { departmentId: string; score: Suppressible<number> }[]
  /** Replaces the old tenure-bucket breakdown - the backend schema tracks position, not
   * tenure. Positions below n<5 are simply absent from the list. */
  positionComparison: PositionScore[]
  decisionItems: DecisionItem[]
}
