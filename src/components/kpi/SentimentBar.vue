<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SentimentSplit } from '@/types/common'

const props = defineProps<{ sentiment: SentimentSplit | null; compact?: boolean }>()
const { t } = useI18n()

const segments = computed(() =>
  props.sentiment === null
    ? []
    : [
        { key: 'positive', value: props.sentiment.positive, color: 'var(--color-positive)' },
        { key: 'neutral', value: props.sentiment.neutral, color: 'var(--color-neutral)' },
        { key: 'negative', value: props.sentiment.negative, color: 'var(--color-negative)' },
      ],
)
</script>

<template>
  <div class="sentiment-bar" :class="{ compact: props.compact }">
    <p v-if="sentiment === null" class="empty">{{ t('metrics.insufficient') }}</p>
    <div v-else class="track">
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

.empty {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
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
