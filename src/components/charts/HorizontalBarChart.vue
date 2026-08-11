<script setup lang="ts">
import { computed } from 'vue'
import type { Suppressible } from '@/types/common'

export interface HorizontalBarDatum {
  label: string
  value: Suppressible<number>
}

const props = withDefaults(
  defineProps<{
    data: HorizontalBarDatum[]
    max?: number
    /** When false, no numeric value is rendered — bars are visual comparison only. */
    showValues?: boolean
  }>(),
  { showValues: true },
)

const maxValue = computed(
  () =>
    props.max ??
    Math.max(
      ...props.data.map((d) => (!d.value.suppressed ? d.value.data : 0)),
      1,
    ),
)
</script>

<template>
  <div class="bar-chart">
    <div v-for="datum in data" :key="datum.label" class="bar-row">
      <span class="bar-label">{{ datum.label }}</span>
      <div class="track">
        <div
          v-if="!datum.value.suppressed"
          class="fill"
          :style="{ width: (datum.value.data / maxValue) * 100 + '%' }"
        />
        <span v-else class="suppressed-text">🔒</span>
      </div>
      <span v-if="showValues && !datum.value.suppressed" class="bar-value">
        {{ datum.value.data.toFixed(1) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.bar-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.bar-row {
  display: grid;
  grid-template-columns: 140px 1fr auto;
  align-items: center;
  gap: var(--space-3);
}

.bar-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
}

.track {
  height: 14px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.fill {
  height: 100%;
  background: var(--color-executive);
  border-radius: 999px;
}

.suppressed-text {
  padding-left: var(--space-2);
  font-size: var(--font-size-xs);
}

.bar-value {
  font-size: var(--font-size-sm);
  font-weight: 700;
  min-width: 32px;
  text-align: right;
}
</style>
