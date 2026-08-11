<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  modelValue: string
  hashtags: string[]
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const { t } = useI18n()
</script>

<template>
  <div class="filter-tabs">
    <button
      type="button"
      class="tab"
      :class="{ active: props.modelValue === 'popular' }"
      @click="emit('update:modelValue', 'popular')"
    >
      {{ t('feed.popular') }}
    </button>
    <button
      type="button"
      class="tab"
      :class="{ active: props.modelValue === 'newest' }"
      @click="emit('update:modelValue', 'newest')"
    >
      {{ t('feed.newest') }}
    </button>
    <button
      v-for="tag in props.hashtags"
      :key="tag"
      type="button"
      class="tab tag"
      :class="{ active: props.modelValue === tag }"
      @click="emit('update:modelValue', tag)"
    >
      #{{ tag }}
    </button>
  </div>
</template>

<style scoped>
.filter-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.tab {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 999px;
  padding: var(--space-1) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text-muted);
}

.tab:hover {
  background: var(--color-bg);
}

.tab.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
</style>
