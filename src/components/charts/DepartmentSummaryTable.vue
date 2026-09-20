<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { DepartmentSummaryRow } from '@/api/dashboard'

defineProps<{ rows: DepartmentSummaryRow[] }>()
const { t } = useI18n()

function responseLabel(row: DepartmentSummaryRow) {
  const count = row.responded.suppressed ? '<5' : String(row.responded.data)
  return `${count} / ${row.total ?? '—'}`
}

function statusLabel(row: DepartmentSummaryRow) {
  if (row.status !== 'unavailable') return t(`departmentScores.status.${row.status}`)
  return !row.responded.suppressed && row.responded.data === 0
    ? t('departmentScores.noResponses')
    : t('privacy.suppressed')
}
</script>

<template>
  <div class="table-wrap">
    <table>
      <caption class="visually-hidden">{{ t('departmentScores.title') }}</caption>
      <thead>
        <tr>
          <th scope="col">{{ t('departmentScores.department') }}</th>
          <th scope="col">{{ t('departmentScores.responses') }}</th>
          <th scope="col">{{ t('departmentScores.average') }}</th>
          <th scope="col">{{ t('departmentScores.change') }}</th>
          <th scope="col">{{ t('departmentScores.forecast') }}</th>
          <th scope="col">{{ t('departmentScores.statusTitle') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.departmentId">
          <th scope="row">
            {{ row.departmentId === '__unassigned__' ? t('heatmap.unassigned') : row.name }}
          </th>
          <td>{{ responseLabel(row) }}</td>
          <td class="number">{{ row.score.suppressed ? '—' : `${row.score.data.toFixed(1)}/5` }}</td>
          <td class="number" :class="{ positive: row.change !== null && row.change > 0, negative: row.change !== null && row.change < 0 }">
            {{ row.change === null ? '—' : `${row.change > 0 ? '+' : ''}${row.change.toFixed(1)}` }}
          </td>
          <td class="number">{{ row.forecast === null ? '—' : `${row.forecast.toFixed(1)}/5` }}</td>
          <td><span class="status" :class="row.status">{{ statusLabel(row) }}</span></td>
        </tr>
        <tr v-if="rows.length === 0">
          <td colspan="6" class="empty">{{ t('departmentScores.empty') }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 690px; border-collapse: collapse; font-size: var(--font-size-sm); }
th, td { padding: var(--space-3) var(--space-2); text-align: left; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
thead th { color: var(--color-text-muted); font-size: var(--font-size-xs); font-weight: 700; }
tbody th { font-weight: 600; }
.number { font-variant-numeric: tabular-nums; font-weight: 600; }
.positive { color: var(--color-success); }
.negative { color: var(--color-danger); }
.status { display: inline-block; padding: 3px 9px; border-radius: 999px; background: var(--color-bg); color: var(--color-text-muted); font-size: var(--font-size-xs); font-weight: 700; }
.status.good { background: color-mix(in srgb, var(--color-success) 12%, transparent); color: var(--color-success); }
.status.watch { background: color-mix(in srgb, var(--color-warning) 14%, transparent); color: var(--color-warning); }
.status.risk { background: color-mix(in srgb, var(--color-danger) 12%, transparent); color: var(--color-danger); }
.empty { text-align: center; color: var(--color-text-muted); }
.visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
