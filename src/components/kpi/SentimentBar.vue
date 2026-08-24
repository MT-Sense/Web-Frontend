<script setup lang="ts">
import { computed } from 'vue'
import type { SentimentSplit } from '@/types/common'

const props = defineProps<{ sentiment: SentimentSplit; compact?: boolean }>()

const segments = computed(() => [
  { key: 'positive', value: props.sentiment.positive, color: 'var(--color-positive)' },
  { key: 'neutral', value: props.sentiment.neutral, color: 'var(--color-neutral)' },
  { key: 'negative', value: props.sentiment.negative, color: 'var(--color-negative)' },
])
</script>

<template>
  <div class="sentiment-bar" :class="{ compact: props.compact }">
    <div class="track">
      <div
        v-for="seg in segments"
        :key="seg.key"
        class="segment"
        :style="{ width: seg.value + '%', background: seg.color }"
      />
    </div>
    <div class="legend">
      <span v-for="seg in segments" :key="seg.key" class="legend-item">
        <span class="dot" :style="{ background: seg.color }" />
        {{ seg.value }}%
      </span>
    </div>
  </div>
</template>

<style scoped>
.sentiment-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.track {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--color-bg);
}

.segment {
  height: 100%;
}

.legend {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-1);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.compact .legend {
  display: none;
}
</style>
