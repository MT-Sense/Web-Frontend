import type { LocalizedText } from './common'

export type ActionItemLevel = 'full' | 'decision'
export type ActionItemStatus = 'in_progress' | 'done'

export interface ActionItem {
  id: string
  topic: LocalizedText
  topicId: string
  assignee: string
  status: ActionItemStatus
  createdBy: 'admin' | 'executive'
  level: ActionItemLevel
  targetDate: string
  /** YYYY-MM-DD, or "" while in progress. */
  doneAt: string
  /** The caller opened this item; executives may only change items they opened. */
  createdByMe: boolean
}
