<script setup lang="ts">
import { computed } from 'vue'

export interface SinglePoint {
  label: string
  value: number
}

const props = defineProps<{ points: SinglePoint[]; max?: number }>()

const width = 480
const height = 160
const padding = 28

const max = computed(() => props.max ?? Math.max(...props.points.map((p) => p.value)) * 1.2)

function x(i: number) {
  const step = (width - padding * 2) / (props.points.length - 1 || 1)
  return padding + step * i
}

function y(value: number) {
  const usable = height - padding * 2
  return padding + usable - (value / max.value) * usable
}

const path = computed(() =>
  props.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' '),
)
</script>

<template>
  <svg :viewBox="`0 0 ${width} ${height}`" role="img" aria-label="Trend line chart">
    <path :d="path" class="line" fill="none" />
    <template v-for="(p, i) in points" :key="p.label">
      <circle :cx="x(i)" :cy="y(p.value)" r="3" class="dot" />
    </template>
    <text v-for="(p, i) in points" :key="`l-${p.label}`" :x="x(i)" :y="height - 6" class="axis-label" text-anchor="middle">
      {{ p.label }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: auto;
}

.line {
  stroke: var(--color-primary);
  stroke-width: 2.5;
  animation: draw 900ms ease-out both;
}

@keyframes draw {
  from {
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dasharray: 1000;
    stroke-dashoffset: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .line {
    animation: none;
  }
}

.dot {
  fill: var(--color-primary);
}

.axis-label {
  font-size: 9px;
  fill: var(--color-text-subtle);
}
</style>
