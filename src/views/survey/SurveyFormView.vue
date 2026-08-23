<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { useIsMobile } from '@/composables/useIsMobile'
import { useSurveyDraftStore } from '@/stores/surveyDraft'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import QuestionRendererScale from '@/components/survey/QuestionRendererScale.vue'
import QuestionRendererOpenText from '@/components/survey/QuestionRendererOpenText.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ArrowRight } from '@lucide/vue'
import * as surveyApi from '@/api/survey'
import { ApiError } from '@/api/client'
import type { SurveyPeriod } from '@/types/survey'

const { t } = useI18n()
const { layoutComponent } = useRoleLayout()
const { isMobile } = useIsMobile()
const router = useRouter()
const draftStore = useSurveyDraftStore()

const tagSuggestions = ['ภาระงาน', 'สวัสดิการ', 'สื่อสาร']

const period = ref<SurveyPeriod | null>(null)
const loading = ref(true)
const error = ref(false)
const submitting = ref(false)
const submitError = ref(false)

onMounted(async () => {
  loading.value = true
  error.value = false
  try {
    period.value = await surveyApi.current()
    draftStore.load(period.value.id)
  } catch (err) {
    if (!(err instanceof ApiError && err.status === 404)) {
      error.value = true
    }
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (!period.value || draftStore.draft.score === null || submitting.value) return
  submitting.value = true
  submitError.value = false
  try {
    await surveyApi.submit({
      satisfactionScore: draftStore.draft.score,
      commentText: draftStore.draft.commentText,
      optedInToFeed: draftStore.draft.optedIn,
      tags: draftStore.draft.tags,
    })
    draftStore.clear()
    router.push('/survey/thank-you')
  } catch {
    submitError.value = true
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <component :is="layoutComponent" hide-sidebar :breadcrumb="t('nav.mySurveys')">
    <div class="survey-form">
      <p v-if="loading">{{ t('common.loading') }}</p>
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>{{ t('common.loadError') }}</AlertDescription>
      </Alert>
      <Alert v-else-if="!period">
        <AlertDescription>{{ t('survey.noOpenPeriod') }}</AlertDescription>
      </Alert>
      <Alert v-else-if="period.alreadySubmitted">
        <AlertDescription>{{ t('survey.alreadySubmitted') }}</AlertDescription>
      </Alert>

      <template v-else>
        <PrivacyBanner variant="survey-step" />

        <div class="question-block">
          <label class="question-text">{{ t('survey.satisfactionQuestion') }} <span class="required">*</span></label>
          <QuestionRendererScale v-model="draftStore.draft.score" :circular="isMobile" />
        </div>

        <div class="question-block">
          <label class="question-text">{{ t('survey.commentLabel') }}</label>
          <QuestionRendererOpenText
            v-model="draftStore.draft.commentText"
            v-model:tags="draftStore.draft.tags"
            v-model:opted-in="draftStore.draft.optedIn"
            :tag-suggestions="tagSuggestions"
          />
        </div>

        <Alert v-if="submitError" variant="destructive">
          <AlertDescription>{{ t('survey.submitFailed') }}</AlertDescription>
        </Alert>

        <Button
          size="lg"
          class="submit-btn"
          :disabled="draftStore.draft.score === null || submitting"
          @click="handleSubmit"
        >
          {{ t('common.submit') }}
          <ArrowRight :size="16" aria-hidden="true" />
        </Button>
      </template>
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

.submit-btn {
  align-self: flex-end;
}

@media (max-width: 640px) {
  .survey-form {
    gap: var(--space-4);
  }

  .question-block {
    padding: var(--space-4);
  }

  .submit-btn {
    align-self: stretch;
  }
}
</style>
