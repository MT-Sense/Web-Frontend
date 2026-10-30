<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export interface RadarAxis {
  label: string
  thisMonth: number | null
  lastMonth: number | null
}

const props = defineProps<{ axes: RadarAxis[]; max?: number }>()
const { t } = useI18n()
const hasValues = computed(() =>
  props.axes.some((axis) => axis.thisMonth !== null || axis.lastMonth !== null),
)

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

function seriesPath(key: 'thisMonth' | 'lastMonth') {
  let drawing = false
  const path = props.axes
    .map((axis, index) => {
      const value = axis[key]
      if (value === null) {
        drawing = false
        return ''
      }
      const point = pointFor(index, value)
      const command = drawing ? 'L' : 'M'
      drawing = true
      return `${command} ${point.x} ${point.y}`
    })
    .join(' ')
  return (
    path + (props.axes.length > 2 && props.axes.every((axis) => axis[key] !== null) ? ' Z' : '')
  )
}
const series = computed(() =>
  (['lastMonth', 'thisMonth'] as const).map((key) => ({
    key,
    path: seriesPath(key),
    complete: props.axes.every((axis) => axis[key] !== null),
    points: props.axes.flatMap((axis, index) =>
      axis[key] === null
        ? []
        : [{ ...pointFor(index, axis[key]), label: axis.label, value: axis[key] }],
    ),
  })),
)
</script>

<template>
  <p v-if="!hasValues" class="empty">{{ t('metrics.insufficient') }}</p>
  <svg v-else :viewBox="`0 0 ${size} ${size}`" role="img" :aria-label="t('executive.radarTitle')">
    <polygon
      v-for="level in gridLevels"
      :key="level"
      :points="gridPolygon(level)"
      class="grid-ring"
      fill="none"
    />
    <g v-for="item in series" :key="item.key">
      <path
        :d="item.path"
        :class="item.key === 'thisMonth' ? 'poly-this' : 'poly-last'"
        :style="!item.complete ? { fill: 'none' } : undefined"
      />
      <circle
        v-for="point in item.points"
        :key="point.label"
        :cx="point.x"
        :cy="point.y"
        r="3"
        :fill="item.key === 'thisMonth' ? 'var(--color-primary)' : 'var(--color-text-subtle)'"
      >
        <title>
          {{ point.label }} ·
          {{ t(item.key === 'thisMonth' ? 'executive.thisMonth' : 'executive.lastMonth') }}:
          {{ point.value }}/5
        </title>
      </circle>
    </g>
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
  fill: none;
  stroke: var(--color-text-subtle);
  stroke-width: 2;
  stroke-dasharray: 5 4;
}

.empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
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
