import { describe, it, expect } from 'vitest'
import { feedPosts } from '../feed'

describe('feed mock data', () => {
  it('only counts posts that are both optedIn and published as feed-visible', () => {
    const visible = feedPosts.filter((p) => p.optedIn && p.published)
    expect(visible.every((p) => p.optedIn && p.published)).toBe(true)
    // fixtures include a not-yet-moderated post and an opted-out post — neither should be visible
    expect(visible.find((p) => p.id === 'f5')).toBeUndefined()
    expect(visible.find((p) => p.id === 'f6')).toBeUndefined()
    expect(visible.length).toBeGreaterThan(0)
  })
})
