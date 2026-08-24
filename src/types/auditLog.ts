/** Tracks only whether the caller submitted each survey period, never what they answered —
 * intentionally decoupled from any response content at the type level. */
export interface PeriodSubmissionStatus {
  periodId: string
  month: number
  year: number
  status: 'submitted' | 'not_submitted'
  submittedAt: string | null
}
