<script setup lang="ts">
import type { Component } from 'vue'
import { useI18n } from 'vue-i18n'
import { Circle, FileText, ListChecks, Star, TrendingUp } from '@lucide/vue'
import type { QuestionType } from '@/types/survey'

const emit = defineEmits<{ add: [type: QuestionType] }>()
const { t } = useI18n()

const paletteItems: { type: QuestionType; label: string; icon: Component }[] = [
  { type: 'scale5', label: 'Scale 1-5', icon: Star },
  { type: 'singleChoice', label: 'Single choice', icon: Circle },
  { type: 'multiChoice', label: 'Multiple choice', icon: ListChecks },
  { type: 'openText', label: 'Open text', icon: FileText },
  { type: 'enps', label: 'eNPS 0-10', icon: TrendingUp },
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
      <component :is="item.icon" :size="16" class="icon" aria-hidden="true" />
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

.palette-item {
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    transform 150ms ease;
}

.palette-item:hover {
  background: var(--color-accent-100);
  border-color: var(--color-primary);
  color: var(--color-accent-700);
}

.palette-item:active {
  transform: scale(0.97);
}

.icon {
  flex: none;
}
</style>
