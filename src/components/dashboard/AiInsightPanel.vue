<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { AiInsight } from '@/types/insight'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'

const props = defineProps<{ insight: AiInsight }>()
const { locale, t } = useI18n()

const confidenceLabel = computed(() => t(`insight.confidence${capitalize(props.insight.confidence)}`))
function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
</script>

<template>
  <section class="insight-panel panel">
    <div class="header">
      <h2>{{ t('insight.title') }}</h2>
      <div class="score">
        <span class="score-value">{{ insight.overallScore }}/100</span>
        <span class="confidence" :class="`confidence-${insight.confidence}`">{{ confidenceLabel }}</span>
      </div>
    </div>
    <p class="summary">{{ insight.summary[locale as Locale] }}</p>
    <div class="issues">
      <ProgressBarLabeled
        v-for="issue in insight.issueConfidence"
        :key="issue.label.th"
        :label="issue.label[locale as Locale]"
        :percentage="issue.confidence"
      />
    </div>
  </section>
</template>

<style scoped>
.insight-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  font-size: var(--font-size-md);
}

.score {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.score-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.confidence {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.confidence-high {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}

.confidence-medium {
  background: var(--color-neutral-bg);
  color: var(--color-neutral);
}

.confidence-low {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}

.summary {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.issues {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
