<script setup lang="ts">
export interface DropdownOption {
  value: string
  label: string
}

const props = defineProps<{
  modelValue: string
  options: DropdownOption[]
}>()

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function onChange(e: Event) {
  emit('update:modelValue', (e.target as HTMLSelectElement).value)
}
</script>

<template>
  <select class="dropdown-select" :value="props.modelValue" @change="onChange">
    <option v-for="opt in props.options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
  </select>
</template>

<style scoped>
.dropdown-select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
}
</style>
