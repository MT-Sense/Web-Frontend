/** Wraps any department/team-scoped value that must be hidden when respondentCount < 5. */
export type Suppressible<T> = { suppressed: true } | { suppressed: false; data: T }

export function suppressed<T>(): Suppressible<T> {
  return { suppressed: true }
}

export function visible<T>(data: T): Suppressible<T> {
  return { suppressed: false, data }
}

export type Locale = 'th' | 'en'
export type LocalizedText = Record<Locale, string>

export type ConfidenceLevel = 'high' | 'medium' | 'low'

export type SentimentSplit = {
  positive: number
  neutral: number
  negative: number
}
