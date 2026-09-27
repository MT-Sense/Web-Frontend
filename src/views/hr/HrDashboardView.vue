<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Download, Mail } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import DropdownSelect from '@/components/common/DropdownSelect.vue'
import KpiCard from '@/components/kpi/KpiCard.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import HeatmapGrid from '@/components/charts/HeatmapGrid.vue'
import WordCloud from '@/components/charts/WordCloud.vue'
import DepartmentSummaryTable from '@/components/charts/DepartmentSummaryTable.vue'
import DashboardAlerts from '@/components/dashboard/DashboardAlerts.vue'
import AiInsightPanel from '@/components/dashboard/AiInsightPanel.vue'
import KnowledgeQAPanel from '@/components/dashboard/KnowledgeQAPanel.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'
import * as periodsApi from '@/api/periods'
import { ApiError } from '@/api/client'

const { t, locale } = useI18n()
const router = useRouter()

const selectedPeriod = ref('')
const selectedDepartment = ref('all')
type TrendMetric = 'enps' | 'satisfaction' | 'responseRate' | 'burnoutRisk'
const selectedTrendMetric = ref<TrendMetric>('satisfaction')

const { data: periods } = useAsyncData(() => periodsApi.list())

const periodOptions = computed(() =>
  (periods.value ?? []).map((p) => ({
    value: p.id,
    label: `${p.year}-${String(p.month).padStart(2, '0')}`,
  })),
)

watch(periods, (list) => {
  if (list && list.length > 0 && !selectedPeriod.value) {
    selectedPeriod.value = list[0]!.id
  }
})

// A period needs at least five AI-analyzed responses before an insight can be shown. A 404
// therefore resolves to null without hiding the dashboard panels that did load.
async function loadInsight(period?: string) {
  try {
    return await dashboardApi.insight(period)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

async function loadDashboard() {
  const period = selectedPeriod.value || undefined
  const department = selectedDepartment.value
  const [kpis, departmentTrend, heatmap, departmentSummary, wordCloud, insight, alerts, extraQuestions] = await Promise.all([
    dashboardApi.hrKpis(period),
    department === 'all' ? Promise.resolve(null) : dashboardApi.departmentTrend(department, period),
    dashboardApi.heatmap(period),
    dashboardApi.departmentSummary(period).catch(() => null),
    dashboardApi.wordCloud(period).catch(() => null),
    loadInsight(period),
    dashboardApi.alerts(period).catch(() => null),
    dashboardApi.extraQuestions(period),
  ])
  return { kpis, departmentTrend, heatmap, departmentSummary, wordCloud, insight, alerts, extraQuestions }
}

const { data, loading, error, reload } = useAsyncData(loadDashboard)

watch([selectedPeriod, selectedDepartment], () => {
  if (selectedPeriod.value) reload()
})

const departmentOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  ...(data.value?.heatmap.rows.map((r) => ({
    value: r.department.id,
    label: r.department.id === '__unassigned__' ? t('heatmap.unassigned') : r.department.name,
  })) ?? []),
])

const isFiltered = computed(() => selectedDepartment.value !== 'all')
const selectedDepartmentName = computed(() =>
  departmentOptions.value.find((option) => option.value === selectedDepartment.value)?.label ?? '',
)
const heatmapRows = computed(() =>
  selectedDepartment.value === 'all'
    ? (data.value?.heatmap.rows ?? [])
    : (data.value?.heatmap.rows.filter((row) => row.department.id === selectedDepartment.value) ?? []),
)
const heatmapTopics = computed(() => {
  const topics = data.value?.heatmap.topics ?? []
  if (!isFiltered.value) return topics
  const visibleTopicIDs = new Set(
    heatmapRows.value.flatMap((row) => row.cells.filter((cell) => !cell.score.suppressed).map((cell) => cell.topicId)),
  )
  return topics.filter((topic) => visibleTopicIDs.has(topic.id))
})
const displayedHeatmapRows = computed(() => {
  if (!isFiltered.value) return heatmapRows.value
  const topicIDs = new Set(heatmapTopics.value.map((topic) => topic.id))
  return heatmapRows.value.map((row) => ({
    ...row,
    cells: row.cells.filter((cell) => topicIDs.has(cell.topicId)),
  }))
})
const departmentSummaryRows = computed(() => {
  const rows = data.value?.departmentSummary?.rows ?? []
  return selectedDepartment.value === 'all'
    ? rows
    : rows.filter((row) => row.departmentId === selectedDepartment.value)
})

watch(() => data.value?.heatmap.rows, (rows) => {
  if (rows && selectedDepartment.value !== 'all' && !rows.some((row) => row.department.id === selectedDepartment.value)) {
    selectedDepartment.value = 'all'
  }
})

const trendMetrics = computed(() => [
  { key: 'satisfaction' as const, label: t('kpi.satisfaction'), min: 1, max: 5, format: 'score' as const },
  { key: 'enps' as const, label: t('kpi.enps'), min: -100, max: 100, format: 'number' as const },
  { key: 'responseRate' as const, label: t('kpi.responseRate'), min: 0, max: 100, format: 'percent' as const },
  { key: 'burnoutRisk' as const, label: t('kpi.burnoutRisk'), min: 0, max: 100, format: 'percent' as const },
])
const activeTrendMetric = computed(() => trendMetrics.value.find((metric) => metric.key === selectedTrendMetric.value)!)
const trendPoints = computed(() => {
  if (isFiltered.value) {
    return (data.value?.departmentTrend ?? []).map((point) => ({
      label: point.month,
      value: point[selectedTrendMetric.value],
    }))
  }
  return (data.value?.kpis.trend ?? []).map((point) => ({
    label: point.month,
    value: point.hasResponses ? point[selectedTrendMetric.value] : null,
  }))
})
const trendForecast = computed(() => {
  const points = trendPoints.value
  if (points.length < 2) return null
  const previous = points[points.length - 2]!
  const latest = points[points.length - 1]!
  if (previous.value === null || latest.value === null) return null

  const [year = 0, month = 0] = latest.label.split('-').map(Number)
  if (month < 1 || month > 12) return null
  const nextYear = month === 12 ? year + 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const { min, max, format } = activeTrendMetric.value
  const projected = Math.min(max, Math.max(min, latest.value + (latest.value - previous.value)))

  return {
    label: `${nextYear}-${String(nextMonth).padStart(2, '0')}`,
    value: format === 'score' ? Math.round(projected * 100) / 100 : Math.round(projected),
  }
})

function goToTopic(topicId: string, department: dashboardApi.HeatmapRow['department']) {
  router.push({
    path: `/dashboard/topics/${topicId}`,
    query: { department: department.id, period: selectedPeriod.value || undefined },
  })
}

</script>

<template>
  <HrLayout :breadcrumb="t('nav.dashboard')">
    <div class="toolbar">
      <div class="filters">
        <DropdownSelect v-model="selectedPeriod" :options="periodOptions" />
        <DropdownSelect v-model="selectedDepartment" :options="departmentOptions" />
      </div>
      <div class="actions">
        <Button variant="secondary">
          <Download :size="16" aria-hidden="true" />
          {{ t('common.export') }}
        </Button>
        <Button variant="secondary">
          <Mail :size="16" aria-hidden="true" />
          {{ t('common.sendEmail') }}
        </Button>
      </div>
    </div>

    <PrivacyBanner v-if="isFiltered" variant="filters-active" />

    <p v-if="loading">{{ t('common.loading') }}</p>
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>
        {{ t('common.loadError') }}
        <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
      </AlertDescription>
    </Alert>

    <template v-else-if="data">
      <div class="kpi-row">
        <KpiCard
          :label="t('kpi.enps')"
          :value="String(data.kpis.enps.value)"
          :sublabel="`${data.kpis.enps.deltaVsLastMonth >= 0 ? '+' : ''}${data.kpis.enps.deltaVsLastMonth} vs last month`"
          trend="up"
        />
        <KpiCard
          :label="t('kpi.satisfaction')"
          :value="`${data.kpis.satisfaction.value}/5`"
          :trend="data.kpis.satisfaction.trend"
        />
        <KpiCard
          :label="t('kpi.burnoutRisk')"
          :value="`${data.kpis.burnoutRisk.percentage}%`"
          :sublabel="`${data.kpis.burnoutRisk.departmentsAtRisk} ${t('kpi.departmentsToWatch')}`"
        />
        <KpiCard
          :label="t('kpi.responseRate')"
          :value="`${data.kpis.responseRate.percentage}%`"
          :sublabel="`${data.kpis.responseRate.responded}/${data.kpis.responseRate.total}`"
        />
      </div>

      <section class="panel trend-panel">
        <div class="trend-heading">
          <h2>{{ t('trend.title') }}<span v-if="isFiltered"> · {{ selectedDepartmentName }}</span></h2>
          <div class="trend-metrics" role="group" :aria-label="t('trend.selectMetric')">
            <button
              v-for="metric in trendMetrics"
              :key="metric.key"
              type="button"
              class="trend-metric"
              :class="{ active: selectedTrendMetric === metric.key }"
              :aria-pressed="selectedTrendMetric === metric.key"
              @click="selectedTrendMetric = metric.key"
            >
              {{ metric.label }}
            </button>
          </div>
        </div>
        <TrendLineChart
          :points="trendPoints"
          :forecast="trendForecast"
          :forecast-label="t('trend.forecast')"
          :label="activeTrendMetric.label"
          :min="activeTrendMetric.min"
          :max="activeTrendMetric.max"
          :format="activeTrendMetric.format"
          :empty-text="t('trend.empty')"
        />
        <p class="trend-note">{{ t(trendForecast ? 'trend.methodNote' : 'trend.insufficientForecast') }}</p>
        <p v-if="selectedTrendMetric === 'responseRate'" class="trend-note">{{ t('trend.responseRateNote') }}</p>
      </section>

      <div class="department-alerts-grid">
        <section class="panel department-summary-panel">
          <h2>{{ t('departmentScores.title') }}</h2>
          <DepartmentSummaryTable v-if="data.departmentSummary" :rows="departmentSummaryRows" />
          <p v-else class="wordcloud-error">{{ t('common.loadError') }}</p>
          <p class="summary-note">{{ t('departmentScores.headcountNote') }}</p>
          <p class="summary-note">{{ t('departmentScores.methodNote') }}</p>
        </section>
        <section class="panel alerts-panel">
          <DashboardAlerts :alerts="data.alerts" :departments="data.heatmap.rows.map((row) => row.department)" />
        </section>
      </div>

      <section class="panel heatmap-panel">
        <h2>{{ t('heatmap.title') }}</h2>
        <p class="heatmap-scope">{{ t('heatmap.filterScope') }}</p>
        <HeatmapGrid v-if="heatmapTopics.length" :topics="heatmapTopics" :rows="displayedHeatmapRows" compact @cell-click="goToTopic" />
        <p v-else class="heatmap-scope">{{ t('heatmap.noVisibleTopics') }}</p>
      </section>

      <section v-if="data.extraQuestions.length > 0" class="panel">
        <h2>{{ t('periods.extraQuestions.resultsTitle') }}</h2>
        <ul class="extra-question-results">
          <li v-for="q in data.extraQuestions" :key="q.key">
            <span class="eq-label">{{ locale === 'th' ? q.label.th : q.label.en }}</span>
            <span class="eq-value">
              {{ q.average }}{{ q.type === 'enps_0_10' ? '/10' : '/5' }}
              <span class="eq-count">({{ q.respondentCount }} {{ t('drilldown.respondents') }})</span>
            </span>
          </li>
        </ul>
      </section>

      <KnowledgeQAPanel />

      <div class="insight-sentiment-grid">
        <AiInsightPanel v-if="data.insight" :insight="data.insight.insight" />
        <Alert v-else class="insight-unavailable">
          <AlertDescription>{{ t('insight.notGenerated') }}</AlertDescription>
        </Alert>

        <section class="panel wordcloud-panel">
          <h2>{{ t('kpi.sentimentDistribution') }}</h2>
          <SentimentBar :sentiment="data.kpis.sentiment" />
          <hr class="rule" />
          <h2>{{ t('wordcloud.title') }}</h2>
          <WordCloud v-if="data.wordCloud" :terms="data.wordCloud" compact />
          <p v-else class="wordcloud-error">{{ t('wordcloud.loadError') }}</p>
        </section>
      </div>
    </template>
  </HrLayout>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.filters,
.actions {
  display: flex;
  gap: var(--space-2);
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-3);
}

.kpi-card {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.trend-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-3);
}

.trend-heading h2 { margin: 0; }
.trend-metrics { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.trend-metric {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text-muted);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-size: var(--font-size-sm);
  cursor: pointer;
}
.trend-metric:hover { border-color: var(--color-primary); color: var(--color-primary); }
.trend-metric.active { background: var(--color-primary); border-color: var(--color-primary); color: white; }
.trend-metric:focus-visible { outline: 2px solid var(--color-primary); outline-offset: 2px; }
.trend-note { margin: var(--space-2) 0 0; color: var(--color-text-muted); font-size: var(--font-size-xs); }

.heatmap-scope {
  margin: 0 0 var(--space-3);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.department-alerts-grid {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(240px, 1fr);
  gap: var(--space-4);
  align-items: start;
}

.heatmap-panel,
.alerts-panel { min-width: 0; height: 100%; }

.wordcloud-error {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.insight-sentiment-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: var(--space-4);
  align-items: stretch;
}

.department-summary-panel { min-width: 0; }
.insight-unavailable { min-width: 0; }
.wordcloud-panel { min-width: 0; }
.wordcloud-panel .rule { margin: var(--space-5) 0; }
.summary-note { margin: var(--space-3) 0 0; color: var(--color-text-muted); font-size: var(--font-size-xs); }

.extra-question-results {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.extra-question-results li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  padding: var(--space-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.extra-question-results li:last-child {
  border-bottom: none;
}

.eq-label {
  font-weight: 600;
}

.eq-value {
  font-weight: 700;
  color: var(--color-accent-700);
}

.eq-count {
  font-weight: 400;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
}

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
  .department-alerts-grid { grid-template-columns: 1fr; }
  .insight-sentiment-grid { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 560px) {
  .kpi-row {
    grid-template-columns: 1fr;
  }
  .toolbar {
    align-items: stretch;
  }
  .filters,
  .actions {
    flex-wrap: wrap;
  }
}
</style>
