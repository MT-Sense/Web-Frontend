import { reactive, watch } from 'vue'
import { defineStore } from 'pinia'

/** Single-screen draft for the fixed satisfaction_score + comment_text survey — no more
 * multi-step/multi-question state, just autosave for the one open period. */
export interface SurveyDraft {
  periodId: string | null
  score: number | null
  commentText: string
  tags: string[]
  optedIn: boolean
}

function storageKey(periodId: string) {
  return `mt-sense-survey-draft:${periodId}`
}

function emptyDraft(periodId: string | null): SurveyDraft {
  return { periodId, score: null, commentText: '', tags: [], optedIn: false }
}

export const useSurveyDraftStore = defineStore('surveyDraft', () => {
  const draft = reactive<SurveyDraft>(emptyDraft(''))

  function load(periodId: string) {
    Object.assign(draft, emptyDraft(periodId))
    const raw = localStorage.getItem(storageKey(periodId))
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<SurveyDraft>
        Object.assign(draft, parsed, { periodId })
      } catch {
        // ignore malformed draft
      }
    }
  }

  function clear() {
    if (draft.periodId) localStorage.removeItem(storageKey(draft.periodId))
    Object.assign(draft, emptyDraft(draft.periodId))
  }

  watch(
    draft,
    () => {
      if (!draft.periodId) return
      localStorage.setItem(storageKey(draft.periodId), JSON.stringify(draft))
    },
    { deep: true },
  )

  return { draft, load, clear }
})
