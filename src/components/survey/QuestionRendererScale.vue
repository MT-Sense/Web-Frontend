<script setup lang="ts">
const props = defineProps<{ modelValue: number | null; circular?: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const scale = [1, 2, 3, 4, 5]
</script>

<template>
  <div class="scale-picker" :class="{ circular: props.circular }">
    <button
      v-for="n in scale"
      :key="n"
      type="button"
      class="option"
      :class="{ active: props.modelValue === n }"
      @click="emit('update:modelValue', n)"
    >
      {{ n }}
    </button>
  </div>
</template>

<style scoped>
.scale-picker {
  display: flex;
  gap: var(--space-2);
}

.option {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  font-weight: 700;
  cursor: pointer;
}

.scale-picker.circular .option {
  border-radius: 50%;
}

.option:hover {
  background: var(--color-bg);
}

.option.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
