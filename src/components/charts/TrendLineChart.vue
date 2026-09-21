<script setup lang="ts">
import { computed } from 'vue'

export interface TrendSeriesPoint {
  label: string
  value: number | null
}

const props = defineProps<{
  points: TrendSeriesPoint[]
  label: string
  min: number
  max: number
  format: 'number' | 'score' | 'percent'
  emptyText: string
  forecast?: TrendSeriesPoint | null
  forecastLabel: string
}>()

const width = 720
const height = 270
const left = 54
const right = 54
const pointInset = 40
const top = 30
const bottom = 54
const plotWidth = width - left - right
const plotHeight = height - top - bottom

const hasValues = computed(() => props.points.some((point) => point.value !== null))
const ticks = computed(() => Array.from({ length: 5 }, (_, index) => props.max - ((props.max - props.min) * index) / 4))
const pointCount = computed(() => props.points.length + (props.forecast ? 1 : 0))

function x(index: number) {
  return pointCount.value === 1
    ? left + plotWidth / 2
    : left + pointInset + ((plotWidth - pointInset * 2) * index) / Math.max(pointCount.value - 1, 1)
}

function y(value: number) {
  return top + ((props.max - value) / (props.max - props.min)) * plotHeight
}

function formatValue(value: number) {
  if (props.format === 'score') return `${value.toFixed(2)}/5`
  if (props.format === 'percent') return `${Math.round(value)}%`
  return String(Math.round(value))
}

const path = computed(() => {
  let drawing = false
  return props.points.map((point, index) => {
    if (point.value === null) {
      drawing = false
      return ''
    }
    const command = drawing ? 'L' : 'M'
    drawing = true
    return `${command} ${x(index)} ${y(point.value)}`
  }).join(' ')
})

const description = computed(() => {
  const actual = props.points
    .filter((point) => point.value !== null)
    .map((point) => `${point.label} ${formatValue(point.value!)}`)
  if (props.forecast?.value !== null && props.forecast?.value !== undefined) {
    actual.push(`${props.forecast.label} ${props.forecastLabel} ${formatValue(props.forecast.value)}`)
  }
  return `${props.label}: ${actual.join(', ')}`
})
</script>

<template>
  <div v-if="!hasValues" class="empty">{{ emptyText }}</div>
  <div v-else class="trend-chart">
    <svg :viewBox="`0 0 ${width} ${height}`" role="img" :aria-label="description">
      <g v-for="tick in ticks" :key="tick">
        <line :x1="left" :x2="width - right" :y1="y(tick)" :y2="y(tick)" class="grid-line" />
        <text :x="left - 10" :y="y(tick) + 4" text-anchor="end" class="axis-label">
          {{ format === 'score' ? tick.toFixed(0) : formatValue(tick) }}
        </text>
      </g>
      <path :d="path" class="trend-line" fill="none" />
      <line
        v-if="forecast && forecast.value !== null && points.at(-1)?.value !== null"
        :x1="x(points.length - 1)"
        :y1="y(points[points.length - 1]!.value!)"
        :x2="x(points.length)"
        :y2="y(forecast.value)"
        class="forecast-line"
      />
      <template v-for="(point, index) in points" :key="point.label">
        <text :x="x(index)" :y="height - 25" text-anchor="middle" class="axis-label">{{ point.label }}</text>
        <g v-if="point.value !== null">
          <circle :cx="x(index)" :cy="y(point.value)" r="5" class="dot">
            <title>{{ point.label }}: {{ formatValue(point.value) }}</title>
          </circle>
          <text
            :x="x(index)"
            :y="y(point.value) < top + 22 ? y(point.value) + 24 : y(point.value) - 12"
            text-anchor="middle"
            class="value-label"
          >
            {{ formatValue(point.value) }}
          </text>
        </g>
      </template>
      <g v-if="forecast && forecast.value !== null">
        <circle :cx="x(points.length)" :cy="y(forecast.value)" r="5" class="forecast-dot">
          <title>{{ forecast.label }} {{ forecastLabel }}: {{ formatValue(forecast.value) }}</title>
        </circle>
        <text
          :x="x(points.length)"
          :y="y(forecast.value) < top + 22 ? y(forecast.value) + 24 : y(forecast.value) - 12"
          text-anchor="middle"
          class="forecast-value"
        >
          ≈{{ formatValue(forecast.value) }}
        </text>
        <text :x="x(points.length)" :y="height - 25" text-anchor="middle" class="axis-label">{{ forecast.label }}</text>
        <text :x="x(points.length)" :y="height - 10" text-anchor="middle" class="forecast-axis-label">{{ forecastLabel }}</text>
      </g>
    </svg>
    <div v-if="forecast" class="forecast-legend"><span class="forecast-swatch" />{{ forecastLabel }}</div>
  </div>
</template>

<style scoped>
.trend-chart { width: 100%; }
svg { display: block; width: 100%; height: auto; }
.grid-line { stroke: var(--color-border); stroke-width: 1; }
.trend-line { stroke: var(--color-primary); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.forecast-line { stroke: var(--color-primary); stroke-width: 3; stroke-dasharray: 7 6; stroke-linecap: round; }
.dot { fill: var(--color-primary); stroke: var(--color-surface); stroke-width: 2; }
.forecast-dot { fill: var(--color-surface); stroke: var(--color-primary); stroke-width: 2; }
.axis-label { fill: var(--color-text-subtle); font-size: 11px; }
.value-label { fill: var(--color-text); font-size: 12px; font-weight: 700; }
.forecast-value { fill: var(--color-primary); font-size: 12px; font-weight: 700; }
.forecast-axis-label { fill: var(--color-primary); font-size: 10px; }
.forecast-legend { display: flex; align-items: center; justify-content: flex-end; gap: var(--space-2); color: var(--color-text-muted); font-size: var(--font-size-xs); }
.forecast-swatch { display: inline-block; width: 24px; border-top: 2px dashed var(--color-primary); }
.empty { color: var(--color-text-muted); font-size: var(--font-size-sm); padding: var(--space-5) 0; }
</style>
