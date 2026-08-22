<script setup lang="ts">
import { computed } from 'vue'

export interface TrendSeriesPoint {
  label: string
  a: number
  b: number
}

const props = defineProps<{
  points: TrendSeriesPoint[]
  seriesALabel: string
  seriesBLabel: string
  aMax?: number
  bMax?: number
}>()

const width = 560
const height = 200
const padding = 32

const maxA = computed(() => props.aMax ?? Math.max(...props.points.map((p) => p.a)) * 1.2)
const maxB = computed(() => props.bMax ?? Math.max(...props.points.map((p) => p.b)) * 1.2)

function x(i: number) {
  const step = (width - padding * 2) / (props.points.length - 1 || 1)
  return padding + step * i
}

function yFor(value: number, max: number) {
  const usable = height - padding * 2
  return padding + usable - (value / max) * usable
}

const pathA = computed(() =>
  props.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yFor(p.a, maxA.value)}`).join(' '),
)
const pathB = computed(() =>
  props.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${yFor(p.b, maxB.value)}`).join(' '),
)
</script>

<template>
  <div class="trend-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="`${seriesALabel} vs ${seriesBLabel}`">
      <path :d="pathA" class="line line-a" fill="none" />
      <path :d="pathB" class="line line-b" fill="none" stroke-dasharray="6 5" />
      <template v-for="(p, i) in points" :key="p.label">
        <circle :cx="x(i)" :cy="yFor(p.a, maxA)" r="3" class="dot dot-a" />
        <circle :cx="x(i)" :cy="yFor(p.b, maxB)" r="3" class="dot dot-b" />
      </template>
      <text
        v-for="(p, i) in points"
        :key="`label-${p.label}`"
        :x="x(i)"
        :y="height - 6"
        class="axis-label"
        text-anchor="middle"
      >
        {{ p.label }}
      </text>
    </svg>
    <div class="legend">
      <span class="legend-item"><span class="swatch swatch-a" />{{ seriesALabel }}</span>
      <span class="legend-item"><span class="swatch swatch-b" />{{ seriesBLabel }}</span>
    </div>
  </div>
</template>

<style scoped>
.trend-chart {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

svg {
  width: 100%;
  height: auto;
}

.line-a {
  stroke: var(--color-primary);
  stroke-width: 2.5;
}

.line-b {
  stroke: var(--color-text-subtle);
  stroke-width: 2.5;
}

.dot-a {
  fill: var(--color-primary);
}

.dot-b {
  fill: var(--color-text-subtle);
}

.axis-label {
  font-size: 9px;
  fill: var(--color-text-subtle);
}

.legend {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.swatch {
  width: 14px;
  height: 2px;
  display: inline-block;
}

.swatch-a {
  background: var(--color-primary);
}

.swatch-b {
  background: var(--color-text-subtle);
  border-top: 2px dashed var(--color-text-subtle);
}

/* lines draw themselves in on mount */
.line {
  stroke-dashoffset: 0;
  animation: draw 900ms ease-out both;
}

.line-b {
  animation-name: draw-dashed;
}

.dot {
  animation: fade-in 500ms ease-out both;
  animation-delay: 700ms;
}

@keyframes draw {
  from {
    stroke-dasharray: 1200;
    stroke-dashoffset: 1200;
  }
  to {
    stroke-dasharray: 1200;
    stroke-dashoffset: 0;
  }
}

@keyframes draw-dashed {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .line,
  .dot {
    animation: none;
  }
}
</style>
