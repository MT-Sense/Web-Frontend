<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { SurveyStep } from '@/types/survey'

const props = defineProps<{ steps: SurveyStep[]; modelValue: number }>()
const emit = defineEmits<{ 'update:modelValue': [index: number]; addStep: [] }>()
const { t, locale } = useI18n()
</script>

<template>
  <div class="step-tabs">
    <button
      v-for="(step, i) in props.steps"
      :key="step.id"
      type="button"
      class="tab"
      :class="{ active: i === props.modelValue }"
      @click="emit('update:modelValue', i)"
    >
      Step {{ i + 1 }} · {{ step.title[locale as Locale] }}
    </button>
    <button type="button" class="tab add" @click="emit('addStep')">+ {{ t('formBuilder.addStep') }}</button>
  </div>
</template>

<style scoped>
.step-tabs {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: var(--space-2);
}

.tab {
  border: none;
  background: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.tab:hover {
  background: var(--color-bg);
}

.tab.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.tab.add {
  color: var(--color-primary);
  border: 1px dashed var(--color-border);
}
</style>
