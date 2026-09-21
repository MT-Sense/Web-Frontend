import { api } from './client'
import type { Topic, TopicDrilldown } from '@/types/topic'
import type { Department } from '@/types/department'
import type { Position } from '@/types/user'
import type { HrKpis, ExecutiveHealth } from '@/types/kpi'
import type { AiInsight, UrgentIssue, WordCloudTerm } from '@/types/insight'
import type { Alert } from '@/types/alert'
import type { Suppressible } from '@/types/common'
import type { ExtraQuestionResult } from '@/types/survey'

export interface HeatmapCell {
  topicId: string
  score: Suppressible<number>
}
export interface HeatmapRow {
  department: Department
  cells: HeatmapCell[]
}
export interface Heatmap {
  topics: Topic[]
  rows: HeatmapRow[]
}
export interface DepartmentSummaryRow {
  departmentId: string
  name: string
  responded: Suppressible<number>
  total: number | null
  score: Suppressible<number>
  change: number | null
  forecast: number | null
  status: 'good' | 'watch' | 'risk' | 'unavailable'
}
export interface DepartmentSummary {
  rows: DepartmentSummaryRow[]
}
export interface DepartmentTrendPoint {
  month: string
  enps: number | null
  satisfaction: number | null
  responseRate: number | null
  burnoutRisk: number | null
}
export interface InsightResponse {
  insight: AiInsight
  urgentIssues: UrgentIssue[]
}

function periodQuery(period?: string) {
  return period ? `?period=${encodeURIComponent(period)}` : ''
}

export function topics() {
  return api.get<Topic[]>('/api/topics')
}

export function departments(period?: string) {
  return api.get<Department[]>(`/api/departments${periodQuery(period)}`)
}

export function positions() {
  return api.get<Position[]>('/api/positions')
}

export function hrKpis(period?: string) {
  return api.get<HrKpis>(`/api/dashboard/hr/kpi${periodQuery(period)}`)
}

export function departmentTrend(department: string, period?: string) {
  const query = new URLSearchParams({ department })
  if (period) query.set('period', period)
  return api.get<DepartmentTrendPoint[]>(`/api/dashboard/hr/trend?${query.toString()}`)
}

export function heatmap(period?: string) {
  return api.get<Heatmap>(`/api/dashboard/hr/heatmap${periodQuery(period)}`)
}

export function departmentSummary(period?: string) {
  return api.get<DepartmentSummary>(`/api/dashboard/hr/departments${periodQuery(period)}`)
}

export function wordCloud(period?: string) {
  return api.get<WordCloudTerm[]>(`/api/dashboard/hr/wordcloud${periodQuery(period)}`)
}

export function insight(period?: string) {
  return api.get<InsightResponse>(`/api/dashboard/hr/insight${periodQuery(period)}`)
}

export function alerts(period?: string) {
  return api.get<Alert[]>(`/api/dashboard/hr/alerts${periodQuery(period)}`)
}

export function extraQuestions(period?: string) {
  return api.get<ExtraQuestionResult[]>(`/api/dashboard/hr/extra-questions${periodQuery(period)}`)
}

export function topicDrilldown(topicId: string, period?: string, department?: string) {
  const query = new URLSearchParams()
  if (period) query.set('period', period)
  if (department) query.set('department', department)
  const suffix = query.size ? `?${query.toString()}` : ''
  return api.get<TopicDrilldown>(`/api/dashboard/hr/topics/${encodeURIComponent(topicId)}${suffix}`)
}

export function executiveSummary(period?: string) {
  return api.get<ExecutiveHealth>(`/api/dashboard/executive/summary${periodQuery(period)}`)
}
