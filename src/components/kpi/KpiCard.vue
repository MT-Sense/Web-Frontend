<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string
    value: string
    sublabel?: string
    trend?: 'up' | 'down' | 'flat'
  }>(),
  { sublabel: '', trend: undefined },
)

const trendIcon: Record<string, string> = { up: '↑', down: '↓', flat: '→' }
const trendClass: Record<string, string> = { up: 'trend-up', down: 'trend-down', flat: 'trend-flat' }
</script>

<template>
  <div class="kpi-card">
    <div class="label">{{ label }}</div>
    <div class="value-row">
      <span class="value">{{ value }}</span>
      <span v-if="trend" class="trend" :class="trendClass[trend]">{{ trendIcon[trend] }}</span>
    </div>
    <div v-if="sublabel" class="sublabel">{{ sublabel }}</div>
    <slot />
  </div>
</template>

<style scoped>
.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  min-width: 0;
}

.label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.value-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-2);
}

.value {
  font-size: var(--font-size-xxl);
  font-weight: 700;
}

.trend {
  font-size: var(--font-size-lg);
  font-weight: 700;
}

.trend-up {
  color: var(--color-positive);
}

.trend-down {
  color: var(--color-negative);
}

.trend-flat {
  color: var(--color-text-subtle);
}

.sublabel {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
</style>
