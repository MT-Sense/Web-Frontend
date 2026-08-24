<script setup lang="ts">
defineProps<{ modelValue: number | null }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const scale = Array.from({ length: 11 }, (_, i) => i)
</script>

<template>
  <div class="enps-picker">
    <button
      v-for="n in scale"
      :key="n"
      type="button"
      class="option"
      :class="{ active: modelValue === n }"
      @click="emit('update:modelValue', n)"
    >
      {{ n }}
    </button>
  </div>
</template>

<style scoped>
.enps-picker {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.option {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.option:hover {
  border-color: var(--color-primary);
  background: var(--color-accent-100);
  color: var(--color-accent-700);
}

.option:active {
  transform: scale(0.93);
}

.option.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-accent-100);
}
</style>
