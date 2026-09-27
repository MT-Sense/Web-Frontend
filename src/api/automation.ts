import { api } from './client'

export interface AutomationSettings {
  revision: number
  minResponses: number
  mentionPercent: number
  toolName: string
  connectorType: 'manual' | 'jira_cloud'
  toolInstructions: string
  jiraSite: string
  jiraEmail: string
  jiraProject: string
  jiraIssueType: string
  allowJiraWrite: boolean
  departmentProjects: Record<string, string> | null
  trainingCatalog: string
  approvalPolicy: string
  benefitsPolicy: string
}

export interface SettingsResponse {
  settings: AutomationSettings
  tokenSet: boolean
  encryptionReady: boolean
  aiReady: boolean
}

export type ProposalStatus = 'pending' | 'approved' | 'rejected' | 'executing' | 'needs_check' | 'executed' | 'in_progress' | 'completed'

export interface Proposal {
  id: string
  periodId: string
  departmentId: string
  playbook: string
  demo: boolean
  status: ProposalStatus
  version: number
  title: string
  rationale: string
  missingData: string[]
  evidence: { id: string; source: string; text: string }[]
  action: 'local_task' | 'jira_task'
  draft: string
  targetSite: string
  targetProject: string
  targetIssueType: string
  reviewedBy?: string
  reviewedAt?: string
  createdAt: string
  resultUrl?: string
  resultNote?: string
}

export interface ProposalEvent {
  id: string
  event: string
  version: number
  actorId: string
  createdAt: string
  snapshot: Proposal
}

const root = '/api/hr/automation'
export const getSettings = () => api.get<SettingsResponse>(`${root}/settings`)
export const saveSettings = (data: AutomationSettings & { token: string; clearToken: boolean }) => api.patch<SettingsResponse>(`${root}/settings`, data)
export const testJira = () => api.post<{ message: string }>(`${root}/jira/test`)
export const list = () => api.get<Proposal[]>(`${root}/proposals`)
export const generate = (periodId: string, departmentId: string) => api.post<{ created: number; message: string; notices?: string[] }>(`${root}/generate`, { periodId, departmentId })
export const review = (p: Proposal, decision: string, edit?: { title: string; draft: string; action: string }) => api.post<Proposal>(`${root}/proposals/${p.id}/review`, { version: p.version, decision, ...edit })
export const execute = (p: Proposal) => api.post<Proposal>(`${root}/proposals/${p.id}/execute`, { version: p.version })
export const complete = (p: Proposal, note: string) => api.post<Proposal>(`${root}/proposals/${p.id}/complete`, { version: p.version, note })
export const events = (id: string) => api.get<ProposalEvent[]>(`${root}/proposals/${id}/events`)
