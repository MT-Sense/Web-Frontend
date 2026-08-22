<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SurveyQuestion } from '@/types/survey'
import { looksIdentifying } from '@/utils/identifyingInfo'
import IdentifyingInfoWarning from './IdentifyingInfoWarning.vue'

const props = defineProps<{
  question: SurveyQuestion
  isFirst: boolean
  isLast: boolean
}>()
const emit = defineEmits<{
  'update:question': [q: SurveyQuestion]
  remove: []
  moveUp: []
  moveDown: []
}>()
const { t } = useI18n()

const warning = computed(() => looksIdentifying(props.question.text.th))

function updateText(value: string) {
  emit('update:question', { ...props.question, text: { ...props.question.text, th: value } })
}

function updateRequired(value: boolean) {
  emit('update:question', { ...props.question, required: value })
}

function updateMetricMapping(value: string) {
  emit('update:question', { ...props.question, metricMapping: value })
}

function updateSendToAi(value: boolean) {
  emit('update:question', { ...props.question, sendToAi: value })
}
</script>

<template>
  <div class="question-card panel">
    <div class="drag-handle" aria-hidden="true">⠿</div>
    <div class="body">
      <div class="top-row">
        <span class="type-tag">{{ question.type }}</span>
        <div class="move-buttons">
          <button type="button" :disabled="isFirst" @click="emit('moveUp')">↑</button>
          <button type="button" :disabled="isLast" @click="emit('moveDown')">↓</button>
          <button type="button" class="delete" @click="emit('remove')">{{ t('common.delete') }}</button>
        </div>
      </div>
      <input
        class="question-text-input"
        :value="question.text.th"
        @input="updateText(($event.target as HTMLInputElement).value)"
      />
      <IdentifyingInfoWarning v-if="warning" />

      <div class="config-row">
        <label class="config-item">
          <input
            type="checkbox"
            :checked="question.required"
            @change="updateRequired(($event.target as HTMLInputElement).checked)"
          />
          {{ t('formBuilder.required') }}
        </label>
        <label class="config-item">
          {{ t('formBuilder.metricMapping') }}:
          <input
            class="metric-input"
            :value="question.metricMapping ?? ''"
            @input="updateMetricMapping(($event.target as HTMLInputElement).value)"
          />
        </label>
        <label v-if="question.type === 'openText'" class="config-item">
          <input
            type="checkbox"
            :checked="question.sendToAi ?? false"
            @change="updateSendToAi(($event.target as HTMLInputElement).checked)"
          />
          {{ t('formBuilder.sendToAi') }}
        </label>
      </div>
    </div>
  </div>
</template>

<style scoped>
.question-card {
  display: flex;
  gap: var(--space-3);
  padding: var(--space-4);
}

.drag-handle {
  cursor: grab;
  color: var(--color-text-subtle);
  font-size: var(--font-size-lg);
  padding-top: var(--space-1);
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.top-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-tag {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-accent-700);
  background: var(--color-accent-100);
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.move-buttons {
  display: flex;
  gap: var(--space-1);
}

.move-buttons button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  width: 28px;
  height: 28px;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}

.move-buttons button:hover:not(:disabled) {
  background: var(--color-bg);
}

.move-buttons button:active:not(:disabled) {
  transform: scale(0.92);
}

.move-buttons button:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.move-buttons .delete {
  width: auto;
  padding: 0 var(--space-2);
  color: var(--color-negative);
  font-size: var(--font-size-xs);
}

.question-text-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
  font-weight: 600;
}

.config-row {
  display: flex;
  gap: var(--space-4);
  flex-wrap: wrap;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  align-items: center;
}

.config-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.metric-input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: 2px var(--space-2);
  width: 100px;
}
</style>
