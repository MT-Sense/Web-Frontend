import { api } from './client'

export interface TrainingReport {
  accuracy: number
  macroF1: number
  testRows: number
  trainingRows: number
}

export function train(file: File) {
  const workbook = new Blob([file], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  return api.post<TrainingReport>('/api/ai/train', workbook)
}
