import type { LocalizedText } from './common'

export type ActionItemLevel = 'full' | 'decision'
export type ActionItemStatus = 'in_progress' | 'done'

export interface ActionItem {
  id: string
  topic: LocalizedText
  assignee: string
  status: ActionItemStatus
  createdBy: 'admin' | 'executive'
  level: ActionItemLevel
  targetDate: string
}
