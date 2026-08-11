<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { LocalizedText } from '@/types/common'

const props = defineProps<{
  modelValue: string | string[] | null
  options: LocalizedText[]
  multiple: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()
const { locale } = useI18n()

const selectedSet = computed(() => new Set(Array.isArray(props.modelValue) ? props.modelValue : []))

function toggle(optionLabel: string) {
  if (props.multiple) {
    const next = new Set(selectedSet.value)
    if (next.has(optionLabel)) next.delete(optionLabel)
    else next.add(optionLabel)
    emit('update:modelValue', [...next])
  } else {
    emit('update:modelValue', optionLabel)
  }
}

function isSelected(optionLabel: string) {
  return props.multiple ? selectedSet.value.has(optionLabel) : props.modelValue === optionLabel
}
</script>

<template>
  <div class="choice-list">
    <button
      v-for="opt in options"
      :key="opt.th"
      type="button"
      class="choice"
      :class="{ active: isSelected(opt.th) }"
      @click="toggle(opt.th)"
    >
      <span class="indicator" :class="{ round: !multiple }" />
      {{ opt[locale as Locale] }}
    </button>
  </div>
</template>

<style scoped>
.choice-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.choice {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  text-align: left;
  cursor: pointer;
  font-weight: 500;
}

.choice:hover {
  background: var(--color-bg);
}

.choice.active {
  border-color: var(--color-primary);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-weight: 700;
}

.indicator {
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-radius: 4px;
  flex-shrink: 0;
}

.indicator.round {
  border-radius: 50%;
}

.choice.active .indicator {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
</style>
