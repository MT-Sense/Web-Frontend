import { api } from './client'
import type { SurveyPeriod } from '@/types/survey'

/** HR-only survey period scheduling — replaces the old Form Builder now that each period is
 * a fixed satisfaction_score + comment_text round rather than an authored form. */
export function list() {
  return api.get<SurveyPeriod[]>('/api/survey-periods')
}

export function create(payload: { month: number; year: number; enabledExtraQuestions: string[] }) {
  return api.post<SurveyPeriod>('/api/survey-periods', payload)
}

export function close(id: string) {
  return api.post<SurveyPeriod>(`/api/survey-periods/${id}/close`)
}

export interface ImportPreview {
  rowCount: number
  departments: { name: string; count: number }[]
  alreadyImported: boolean
}

function workbookBody(file: File) {
  return new Blob([file], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

export function previewImport(periodId: string, file: File) {
  return api.post<ImportPreview>(`/api/survey-periods/${encodeURIComponent(periodId)}/import/preview`, workbookBody(file))
}

export function importWorkbook(periodId: string, file: File) {
  return api.post<{ imported: number }>(`/api/survey-periods/${encodeURIComponent(periodId)}/import`, workbookBody(file))
}
