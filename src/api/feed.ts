import { api } from './client'
import type { FeedPost } from '@/types/feedPost'
import type { ActionItem } from '@/types/actionItem'
import type { LocalizedText } from '@/types/common'

export interface CreateActionItemPayload {
  topic: LocalizedText
  topicId: string
  assignee: string
  targetDate: string
}

export interface FeedList {
  posts: FeedPost[]
  total: number
  limit: number
  offset: number
}

export type SummaryStatus = 'draft' | 'published'

export interface PublishedSummary {
  id: string
  title: LocalizedText
  body: LocalizedText
  /** YYYY-MM-DD, or "" for a draft. */
  publishedAt: string
  /** The survey round this summary is about, or "". */
  periodId: string
  status: SummaryStatus
}

export function list(
  params: { tag?: string; sort?: 'popular' | 'newest'; limit?: number; offset?: number } = {},
) {
  const qs = new URLSearchParams()
  if (params.tag) qs.set('tag', params.tag)
  if (params.sort) qs.set('sort', params.sort)
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.offset) qs.set('offset', String(params.offset))
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return api.get<FeedList>(`/api/feed${suffix}`)
}

export function vote(postId: string, direction: 1 | -1) {
  return api.post<FeedPost>(`/api/feed/${postId}/vote`, { direction })
}

export function summaries() {
  return api.get<PublishedSummary[]>('/api/summaries')
}

export function actionItems() {
  return api.get<ActionItem[]>('/api/action-items')
}

export function createActionItem(payload: CreateActionItemPayload) {
  return api.post<ActionItem>('/api/action-items', payload)
}

/** HR only: opted-in posts that have not been published or rejected yet. */
export function pendingModeration() {
  return api.get<FeedPost[]>('/api/feed/pending')
}

/** HR only: publish/reject a post (gate two), set HR's public reply and link an action item ("" removes either). */
export function moderate(postId: string, payload: { published?: boolean; hrReply?: string; actionItemId?: string }) {
  return api.patch<FeedPost>(`/api/feed/${postId}/moderate`, payload)
}

export interface UpdateActionItemPayload {
  status?: ActionItem['status']
  assignee?: string
  targetDate?: string
}

/** HR can change any item; an executive only the ones they opened (`createdByMe`). */
export function updateActionItem(id: string, payload: UpdateActionItemPayload) {
  return api.patch<ActionItem>(`/api/action-items/${id}`, payload)
}

export function deleteActionItem(id: string) {
  return api.delete<void>(`/api/action-items/${id}`)
}
