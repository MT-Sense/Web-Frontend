/** Two-gate publish flow: a post only renders in the feed when both optedIn (author consent
 * at submission time) and published (passed moderation/AI filter) are true. */
export interface FeedPost {
  id: string
  text: string
  hashtags: string[]
  createdAt: string
  upvotes: number
  downvotes: number
  hrReplied: boolean
  optedIn: boolean
  published: boolean
}
