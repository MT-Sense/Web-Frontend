import { api } from './client'

export interface KnowledgeSource {
  periodId: string
  periodLabel: string
  title: string
}

export interface KnowledgeAnswer {
  answer: string
  sources: KnowledgeSource[]
}

export function ask(question: string, locale: 'th' | 'en') {
  return api.post<KnowledgeAnswer>('/api/knowledge-base/ask', { question, locale })
}
