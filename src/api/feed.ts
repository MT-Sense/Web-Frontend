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

export interface PublishedSummary {
  id: string
  title: LocalizedText
  body: LocalizedText
  publishedAt: string
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
