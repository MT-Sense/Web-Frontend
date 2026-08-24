<script setup lang="ts">
import { computed } from 'vue'

export interface RadarAxis {
  label: string
  thisMonth: number
  lastMonth: number
}

const props = defineProps<{ axes: RadarAxis[]; max?: number }>()

const size = 260
const center = size / 2
const radius = 100
const max = computed(() => props.max ?? 5)

function pointFor(index: number, value: number) {
  const angle = (Math.PI * 2 * index) / props.axes.length - Math.PI / 2
  const r = (value / max.value) * radius
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
}

function labelPointFor(index: number) {
  const angle = (Math.PI * 2 * index) / props.axes.length - Math.PI / 2
  const r = radius + 22
  return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
}

const gridLevels = [0.25, 0.5, 0.75, 1]

function gridPolygon(levelRatio: number) {
  return props.axes
    .map((_, i) => {
      const angle = (Math.PI * 2 * i) / props.axes.length - Math.PI / 2
      const r = radius * levelRatio
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`
    })
    .join(' ')
}

const thisMonthPolygon = computed(() =>
  props.axes.map((a, i) => pointFor(i, a.thisMonth)).map((p) => `${p.x},${p.y}`).join(' '),
)
const lastMonthPolygon = computed(() =>
  props.axes.map((a, i) => pointFor(i, a.lastMonth)).map((p) => `${p.x},${p.y}`).join(' '),
)
</script>

<template>
  <svg :viewBox="`0 0 ${size} ${size}`" role="img" aria-label="Radar chart">
    <polygon
      v-for="level in gridLevels"
      :key="level"
      :points="gridPolygon(level)"
      class="grid-ring"
      fill="none"
    />
    <polygon :points="lastMonthPolygon" class="poly poly-last" fill="none" />
    <polygon :points="thisMonthPolygon" class="poly poly-this" />
    <text
      v-for="(axis, i) in axes"
      :key="axis.label"
      :x="labelPointFor(i).x"
      :y="labelPointFor(i).y"
      class="axis-label"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ axis.label }}
    </text>
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  max-width: 320px;
  height: auto;
}

.grid-ring {
  stroke: var(--color-border);
  stroke-width: 1;
}

.poly-last {
  stroke: var(--color-text-subtle);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.poly-this {
  stroke: var(--color-primary);
  stroke-width: 2;
  fill: var(--color-accent-200);
  fill-opacity: 0.55;
}

.axis-label {
  font-size: 10px;
  fill: var(--color-text-muted);
  font-weight: 600;
}
</style>
