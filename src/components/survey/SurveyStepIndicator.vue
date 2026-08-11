<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { SurveyStep } from '@/types/survey'

defineProps<{ step: SurveyStep; stepNumber: number; totalSteps: number }>()
const { t, locale } = useI18n()
</script>

<template>
  <div class="step-indicator">
    <span class="step-count">{{ t('survey.step') }} {{ stepNumber }}/{{ totalSteps }}</span>
    <span class="dot">·</span>
    <span class="step-title">{{ step.title[locale as Locale] }}</span>
    <span class="time">~{{ step.estimatedMinutes }} {{ t('survey.minutes') }}</span>
  </div>
</template>

<style scoped>
.step-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  flex-wrap: wrap;
}

.step-count {
  font-weight: 700;
  color: var(--color-primary);
}

.step-title {
  font-weight: 600;
  color: var(--color-text);
}

.time {
  margin-left: auto;
  color: var(--color-text-subtle);
}
</style>
