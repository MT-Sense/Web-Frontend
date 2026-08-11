/** Tracks only who submitted, never what they answered — intentionally decoupled
 * from SurveyResponse so the two can never be joined at the query/type level. */
export interface AuditSubmissionLogEntry {
  userId: string
  surveyId: string
  status: 'submitted' | 'not_submitted'
  submittedAt: string | null
}
