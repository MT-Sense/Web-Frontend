<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { QuestionType } from '@/types/survey'

const emit = defineEmits<{ add: [type: QuestionType] }>()
const { t } = useI18n()

const paletteItems: { type: QuestionType; label: string; icon: string }[] = [
  { type: 'scale5', label: 'Scale 1-5', icon: '⭐' },
  { type: 'singleChoice', label: 'Single choice', icon: '🔘' },
  { type: 'multiChoice', label: 'Multiple choice', icon: '☑️' },
  { type: 'openText', label: 'Open text', icon: '📝' },
  { type: 'enps', label: 'eNPS 0-10', icon: '📈' },
]
</script>

<template>
  <div class="palette">
    <h3>{{ t('formBuilder.palette') }}</h3>
    <button
      v-for="item in paletteItems"
      :key="item.type"
      type="button"
      class="palette-item"
      @click="emit('add', item.type)"
    >
      <span class="icon">{{ item.icon }}</span>
      {{ item.label }}
    </button>
  </div>
</template>

<style scoped>
.palette {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  width: 220px;
  flex-shrink: 0;
}

h3 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border: 1px dashed var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-align: left;
}

.palette-item:hover {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
}

.icon {
  font-size: var(--font-size-md);
}
</style>
