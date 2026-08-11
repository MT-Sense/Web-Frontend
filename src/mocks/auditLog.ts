import type { AuditSubmissionLogEntry } from '@/types/auditLog'

/** No reference to SurveyResponse or its answers — deliberately unlinked. */
export const auditLog: AuditSubmissionLogEntry[] = [
  { userId: 'u-current', surveyId: 'demo-1', status: 'not_submitted', submittedAt: null },
  { userId: 'u-current', surveyId: 'prev-1', status: 'submitted', submittedAt: '2026-07-02' },
]
