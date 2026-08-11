import type { HrKpis, ExecutiveHealth, TrendPoint } from '@/types/kpi'
import { topics } from './topics'
import { departments } from './departments'
import { getVisibleDepartmentScore } from './heatmap'
import type { Suppressible } from '@/types/common'
import { suppressed, visible } from '@/types/common'

const trend: TrendPoint[] = [
  { month: '2026-03', enps: 22, satisfaction: 3.6 },
  { month: '2026-04', enps: 25, satisfaction: 3.7 },
  { month: '2026-05', enps: 24, satisfaction: 3.65 },
  { month: '2026-06', enps: 28, satisfaction: 3.8 },
  { month: '2026-07', enps: 31, satisfaction: 3.85 },
  { month: '2026-08', enps: 34, satisfaction: 3.9 },
]

export const hrKpis: HrKpis = {
  enps: { value: 34, deltaVsLastMonth: 3 },
  satisfaction: { value: 3.9, trend: 'up' },
  burnoutRisk: { percentage: 18, departmentsAtRisk: 2 },
  responseRate: { percentage: 76, responded: 764, total: 1000 },
  sentiment: { positive: 58, neutral: 29, negative: 13 },
  trend,
}

export const executiveHealth: ExecutiveHealth = {
  score: 78,
  sentiment: { positive: 58, neutral: 29, negative: 13 },
  radar: [
    { topicId: 'work', thisMonth: 3.7, lastMonth: 3.5 },
    { topicId: 'team', thisMonth: 4.0, lastMonth: 3.9 },
    { topicId: 'manager', thisMonth: 3.7, lastMonth: 3.6 },
    { topicId: 'compensation', thisMonth: 3.4, lastMonth: 3.3 },
    { topicId: 'growth', thisMonth: 3.5, lastMonth: 3.3 },
    { topicId: 'benefits', thisMonth: 3.8, lastMonth: 3.7 },
  ],
  departmentComparison: departments.map((d) => ({
    departmentId: d.id,
    score: averageDeptScore(d.id),
  })),
  tenureComparison: [
    { bucket: '<1y', score: 3.9 },
    { bucket: '1-3y', score: 3.7 },
    { bucket: '3-5y', score: 3.5 },
    { bucket: '5y+', score: 3.8 },
  ],
}

function averageDeptScore(deptId: string): Suppressible<number> {
  const dept = departments.find((d) => d.id === deptId)
  if (!dept || dept.respondentCount < 5) return suppressed()
  const scores = topics
    .map((t) => getVisibleDepartmentScore(deptId, t.id))
    .filter((s): s is { suppressed: false; data: number } => !s.suppressed)
    .map((s) => s.data)
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length
  return visible(Math.round(avg * 10) / 10)
}
