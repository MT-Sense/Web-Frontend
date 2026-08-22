<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { useIsMobile } from '@/composables/useIsMobile'
import { useSurveyDraftStore } from '@/stores/surveyDraft'
import { surveys } from '@/mocks/surveys'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import SurveyStepIndicator from '@/components/survey/SurveyStepIndicator.vue'
import SurveyProgressBar from '@/components/survey/SurveyProgressBar.vue'
import SurveyNavButtons from '@/components/survey/SurveyNavButtons.vue'
import QuestionRendererScale from '@/components/survey/QuestionRendererScale.vue'
import QuestionRendererEnps from '@/components/survey/QuestionRendererEnps.vue'
import QuestionRendererChoice from '@/components/survey/QuestionRendererChoice.vue'
import QuestionRendererOpenText from '@/components/survey/QuestionRendererOpenText.vue'
import type { AnswerValue, SurveyQuestion } from '@/types/survey'
import type { Locale } from '@/types/common'

const props = defineProps<{ id: string }>()
const { locale } = useI18n()
const { layoutComponent } = useRoleLayout()
const { isMobile } = useIsMobile()
const router = useRouter()
const draft = useSurveyDraftStore()

const survey = computed(() => surveys[props.id])

onMounted(() => {
  draft.load(props.id)
})

const totalSteps = computed(() => survey.value?.steps.length ?? 0)
const currentStep = computed(() => survey.value?.steps[draft.stepIndex])
const questionIndexInStep = ref(0)

const currentMobileQuestion = computed<SurveyQuestion | undefined>(
  () => currentStep.value?.questions[questionIndexInStep.value],
)

const flatTotal = computed(
  () => survey.value?.steps.reduce((sum, s) => sum + s.questions.length, 0) ?? 1,
)
const flatAnswered = computed(() => Object.keys(draft.answers).length)
const progressRatio = computed(() => Math.min(flatAnswered.value / flatTotal.value, 1))

function answerValue(questionId: string): AnswerValue {
  return draft.answers[questionId]?.value ?? ''
}

function setAnswer(question: SurveyQuestion, value: AnswerValue) {
  draft.setAnswer(question.id, {
    ...draft.answers[question.id],
    value,
  })
}

function setTags(question: SurveyQuestion, tags: string[]) {
  draft.setAnswer(question.id, { ...draft.answers[question.id], value: answerValue(question.id), tags })
}

function setOptedIn(question: SurveyQuestion, optedInToFeed: boolean) {
  draft.setAnswer(question.id, {
    ...draft.answers[question.id],
    value: answerValue(question.id),
    optedInToFeed,
  })
}

const isLastStep = computed(() => draft.stepIndex === totalSteps.value - 1)
const isLastMobileQuestion = computed(
  () => questionIndexInStep.value === (currentStep.value?.questions.length ?? 1) - 1,
)

function submitSurvey() {
  draft.clear(props.id)
  router.push(`/survey/${props.id}/thank-you`)
}

function goNextDesktop() {
  if (isLastStep.value) {
    submitSurvey()
  } else {
    draft.goNext()
  }
}

function goBackDesktop() {
  draft.goBack()
}

function goNextMobile() {
  if (!isLastMobileQuestion.value) {
    questionIndexInStep.value += 1
    return
  }
  if (isLastStep.value) {
    submitSurvey()
  } else {
    draft.goNext()
    questionIndexInStep.value = 0
  }
}

function goBackMobile() {
  if (questionIndexInStep.value > 0) {
    questionIndexInStep.value -= 1
    return
  }
  if (draft.stepIndex > 0) {
    draft.goBack()
    questionIndexInStep.value = (currentStep.value?.questions.length ?? 1) - 1
  }
}
</script>

<template>
  <component :is="layoutComponent" hide-sidebar :breadcrumb="survey?.title[locale as Locale]">
    <div v-if="survey" class="survey-form">
      <SurveyStepIndicator :step="currentStep!" :step-number="draft.stepIndex + 1" :total-steps="totalSteps" />
      <SurveyProgressBar :ratio="progressRatio" />
      <PrivacyBanner variant="survey-step" />

      <!-- Desktop: full step, all questions, long scroll -->
      <div v-if="!isMobile" class="questions desktop">
        <div v-for="question in currentStep!.questions" :key="question.id" class="question-block">
          <label class="question-text">
            {{ question.text[locale as Locale] }}
            <span v-if="question.required" class="required">*</span>
          </label>
          <QuestionRendererScale
            v-if="question.type === 'scale5'"
            :model-value="(answerValue(question.id) as number) || null"
            @update:model-value="(v) => setAnswer(question, v)"
          />
          <QuestionRendererEnps
            v-else-if="question.type === 'enps'"
            :model-value="(answerValue(question.id) as number) ?? null"
            @update:model-value="(v) => setAnswer(question, v)"
          />
          <QuestionRendererChoice
            v-else-if="question.type === 'singleChoice' || question.type === 'multiChoice'"
            :model-value="(answerValue(question.id) as string | string[]) || (question.type === 'multiChoice' ? [] : null)"
            :options="question.options ?? []"
            :multiple="question.type === 'multiChoice'"
            @update:model-value="(v) => setAnswer(question, v)"
          />
          <QuestionRendererOpenText
            v-else-if="question.type === 'openText'"
            :question="question"
            :model-value="(answerValue(question.id) as string) || ''"
            :tags="draft.answers[question.id]?.tags ?? []"
            :opted-in="draft.answers[question.id]?.optedInToFeed ?? false"
            @update:model-value="(v) => setAnswer(question, v)"
            @update:tags="(v) => setTags(question, v)"
            @update:opted-in="(v) => setOptedIn(question, v)"
          />
        </div>
      </div>

      <!-- Mobile: one question per screen -->
      <div v-else-if="currentMobileQuestion" class="questions mobile">
        <div class="question-block">
          <label class="question-text">
            {{ currentMobileQuestion.text[locale as Locale] }}
            <span v-if="currentMobileQuestion.required" class="required">*</span>
          </label>
          <QuestionRendererScale
            v-if="currentMobileQuestion.type === 'scale5'"
            circular
            :model-value="(answerValue(currentMobileQuestion.id) as number) || null"
            @update:model-value="(v) => setAnswer(currentMobileQuestion!, v)"
          />
          <QuestionRendererEnps
            v-else-if="currentMobileQuestion.type === 'enps'"
            :model-value="(answerValue(currentMobileQuestion.id) as number) ?? null"
            @update:model-value="(v) => setAnswer(currentMobileQuestion!, v)"
          />
          <QuestionRendererChoice
            v-else-if="currentMobileQuestion.type === 'singleChoice' || currentMobileQuestion.type === 'multiChoice'"
            :model-value="(answerValue(currentMobileQuestion.id) as string | string[]) || (currentMobileQuestion.type === 'multiChoice' ? [] : null)"
            :options="currentMobileQuestion.options ?? []"
            :multiple="currentMobileQuestion.type === 'multiChoice'"
            @update:model-value="(v) => setAnswer(currentMobileQuestion!, v)"
          />
          <QuestionRendererOpenText
            v-else-if="currentMobileQuestion.type === 'openText'"
            :question="currentMobileQuestion"
            :model-value="(answerValue(currentMobileQuestion.id) as string) || ''"
            :tags="draft.answers[currentMobileQuestion.id]?.tags ?? []"
            :opted-in="draft.answers[currentMobileQuestion.id]?.optedInToFeed ?? false"
            @update:model-value="(v) => setAnswer(currentMobileQuestion!, v)"
            @update:tags="(v) => setTags(currentMobileQuestion!, v)"
            @update:opted-in="(v) => setOptedIn(currentMobileQuestion!, v)"
          />
        </div>
      </div>

      <SurveyNavButtons
        v-if="!isMobile"
        :show-back="draft.stepIndex > 0"
        :is-last="isLastStep"
        @back="goBackDesktop"
        @next="goNextDesktop"
      />
      <SurveyNavButtons
        v-else
        mobile
        :show-back="draft.stepIndex > 0 || questionIndexInStep > 0"
        :is-last="isLastStep && isLastMobileQuestion"
        @back="goBackMobile"
        @next="goNextMobile"
      />
    </div>
  </component>
</template>

<style scoped>
.survey-form {
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.questions {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.question-block {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.question-text {
  font-weight: 700;
  font-size: var(--font-size-md);
}

.required {
  color: var(--color-negative);
}

.questions.mobile .question-block {
  min-height: 40vh;
  justify-content: center;
}

@media (max-width: 640px) {
  .survey-form {
    gap: var(--space-4);
  }

  .questions {
    gap: var(--space-4);
  }

  .question-block {
    padding: var(--space-4);
  }
}
</style>
