import type { LocalizedText } from './common'
import type { ActionItemStatus } from './actionItem'

export interface LinkedActionItem {
  id: string
  topic: LocalizedText
  status: ActionItemStatus
  targetDate: string
  doneAt: string
}

/** Two-gate publish flow: a post only renders in the feed when both optedIn (author consent
 * at submission time) and published (passed moderation/AI filter) are true. */
export interface FeedPost {
  id: string
  text: string
  hashtags: string[]
  createdAt: string
  upvotes: number
  downvotes: number
  /** Badge flag: true whenever HR has replied (seeded demo posts may have no reply text). */
  hrReplied: boolean
  optedIn: boolean
  published: boolean
  /** HR's public answer, shown under the post to everyone; "" when there is none. */
  hrReply: string
  /** YYYY-MM-DD, or "" when there is no reply. */
  hrRepliedAt: string
  /** The caller's own vote: 1, -1, or 0 for none. Nobody else's votes are ever exposed. */
  myVote: -1 | 0 | 1
  /** What the company is doing about this post (linked by HR), or null. */
  actionItem: LinkedActionItem | null
}
