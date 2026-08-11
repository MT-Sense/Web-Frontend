import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { AnswerValue } from '@/types/survey'

interface DraftAnswer {
  value: AnswerValue
  tags?: string[]
  optedInToFeed?: boolean
}

function storageKey(surveyId: string) {
  return `mt-sense-survey-draft:${surveyId}`
}

export const useSurveyDraftStore = defineStore('surveyDraft', () => {
  const surveyId = ref<string | null>(null)
  const stepIndex = ref(0)
  const answers = ref<Record<string, DraftAnswer>>({})

  function load(id: string) {
    surveyId.value = id
    stepIndex.value = 0
    answers.value = {}
    const raw = localStorage.getItem(storageKey(id))
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        stepIndex.value = parsed.stepIndex ?? 0
        answers.value = parsed.answers ?? {}
      } catch {
        // ignore malformed draft
      }
    }
  }

  function setAnswer(questionId: string, draft: DraftAnswer) {
    answers.value[questionId] = draft
  }

  function goNext() {
    stepIndex.value += 1
  }

  function goBack() {
    if (stepIndex.value > 0) stepIndex.value -= 1
  }

  function clear(id: string) {
    localStorage.removeItem(storageKey(id))
    surveyId.value = null
    stepIndex.value = 0
    answers.value = {}
  }

  watch(
    [surveyId, stepIndex, answers],
    () => {
      if (!surveyId.value) return
      localStorage.setItem(
        storageKey(surveyId.value),
        JSON.stringify({ stepIndex: stepIndex.value, answers: answers.value }),
      )
    },
    { deep: true },
  )

  return { surveyId, stepIndex, answers, load, setAnswer, goNext, goBack, clear }
})
