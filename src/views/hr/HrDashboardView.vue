<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Download, Mail } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import DropdownSelect from '@/components/common/DropdownSelect.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import KpiCard from '@/components/kpi/KpiCard.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import HeatmapGrid from '@/components/charts/HeatmapGrid.vue'
import WordCloud from '@/components/charts/WordCloud.vue'
import DepartmentSummaryTable from '@/components/charts/DepartmentSummaryTable.vue'
import DashboardAlerts from '@/components/dashboard/DashboardAlerts.vue'
import AiInsightPanel from '@/components/dashboard/AiInsightPanel.vue'
import KnowledgeQAPanel from '@/components/dashboard/KnowledgeQAPanel.vue'
import SendSummaryDialog from '@/components/dashboard/SendSummaryDialog.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'
import * as dashboardApi from '@/api/dashboard'
import * as periodsApi from '@/api/periods'
import { ApiError } from '@/api/client'
import { downloadCsv, toCsv, type CsvSection } from '@/utils/csv'
import type { Locale } from '@/types/common'

const { t, locale } = useI18n()
const router = useRouter()
const { toast } = useToast()

const route = useRoute()
const selectedPeriod = computed({
  get: () => (typeof route.query.period === 'string' ? route.query.period : ''),
  set: (period) => {
    void router.replace({ query: { ...route.query, period } })
  },
})
const selectedDepartment = computed({
  get: () => (typeof route.query.department === 'string' ? route.query.department : 'all'),
  set: (department) => {
    void router.replace({
      query: { ...route.query, department: department === 'all' ? undefined : department },
    })
  },
})
const emailDialogOpen = ref(false)
const metricValue = (value: number | null, suffix = '') =>
  value === null ? '—' : `${value}${suffix}`
const metricNote = computed(() =>
  t(data.value?.kpis.dataState === 'suppressed' ? 'metrics.insufficient' : 'metrics.noResponses'),
)
const comparisonLabel = computed(() => {
  const delta = data.value?.kpis.enps.deltaVsLastMonth
  return delta == null
    ? t('metrics.noComparison')
    : t('metrics.delta', { value: `${delta >= 0 ? '+' : ''}${delta}` })
})
const responseCountLabel = computed(() => {
  const rate = data.value?.kpis.responseRate
  if (!rate || rate.percentage === null || rate.responded === null || rate.total === null)
    return t('metrics.noDenominator')
  return `${rate.responded}/${rate.total}`
})
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
  const [
    kpis,
    departmentTrend,
    heatmap,
    departmentSummary,
    wordCloud,
    insight,
    alerts,
    extraQuestions,
  ] = await Promise.all([
    dashboardApi.hrKpis(period),
    department === 'all' ? Promise.resolve(null) : dashboardApi.departmentTrend(department, period),
    dashboardApi.heatmap(period),
    dashboardApi.departmentSummary(period).catch(() => null),
    dashboardApi.wordCloud(period).catch(() => null),
    loadInsight(period),
    dashboardApi.alerts(period).catch(() => null),
    dashboardApi.extraQuestions(period),
  ])
  return {
    kpis,
    departmentTrend,
    heatmap,
    departmentSummary,
    wordCloud,
    insight,
    alerts,
    extraQuestions,
  }
}

const { data, loading, error, reload } = useAsyncData(loadDashboard)

watch([selectedPeriod, selectedDepartment], () => {
  if (selectedPeriod.value) reload()
})

watch(selectedDepartment, (department, previousDepartment) => {
  if (department !== 'all' && department !== previousDepartment) {
    toast.info(t('privacy.filtersActive'))
  }
})

const departmentOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  ...(data.value?.heatmap.rows.map((r) => ({
    value: r.department.id,
    label: r.department.id === '__unassigned__' ? t('heatmap.unassigned') : r.department.name,
  })) ?? []),
])

const isFiltered = computed(() => selectedDepartment.value !== 'all')
const selectedDepartmentName = computed(
  () =>
    departmentOptions.value.find((option) => option.value === selectedDepartment.value)?.label ??
    '',
)
const heatmapRows = computed(() =>
  selectedDepartment.value === 'all'
    ? (data.value?.heatmap.rows ?? [])
    : (data.value?.heatmap.rows.filter((row) => row.department.id === selectedDepartment.value) ??
      []),
)
const heatmapTopics = computed(() => {
  const topics = data.value?.heatmap.topics ?? []
  if (!isFiltered.value) return topics
  const visibleTopicIDs = new Set(
    heatmapRows.value.flatMap((row) =>
      row.cells.filter((cell) => !cell.score.suppressed).map((cell) => cell.topicId),
    ),
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

watch(
  () => data.value?.heatmap.rows,
  (rows) => {
    if (
      rows &&
      selectedDepartment.value !== 'all' &&
      !rows.some((row) => row.department.id === selectedDepartment.value)
    ) {
      selectedDepartment.value = 'all'
    }
  },
)

const trendMetrics = computed(() => [
  {
    key: 'satisfaction' as const,
    label: t('kpi.satisfaction'),
    min: 1,
    max: 5,
    format: 'score' as const,
  },
  { key: 'enps' as const, label: t('kpi.enps'), min: -100, max: 100, format: 'number' as const },
  {
    key: 'responseRate' as const,
    label: t('kpi.responseRate'),
    min: 0,
    max: 100,
    format: 'percent' as const,
  },
  {
    key: 'burnoutRisk' as const,
    label: t('kpi.burnoutRisk'),
    min: 0,
    max: 100,
    format: 'percent' as const,
  },
])
const activeTrendMetric = computed(() =>
  trendMetrics.value.find((metric) => metric.key === selectedTrendMetric.value)!,
)
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

/** Exports what the dashboard shows for the selected round. It only uses data the page
 * already loaded, so anything hidden by the n<5 rule stays hidden in the file. */
function exportCsv() {
  const d = data.value
  if (!d) return
  const hidden = t('export.hidden')
  const show = (s: { suppressed: boolean; data?: number }) => (s.suppressed ? hidden : s.data)
  const period = periodOptions.value.find((o) => o.value === selectedPeriod.value)?.label ?? ''
  const departmentName = (dep: dashboardApi.HeatmapRow['department']) =>
    dep.id === '__unassigned__' ? t('heatmap.unassigned') : dep.name

  const sections: CsvSection[] = [
    {
      title:
        t('export.hrTitle', { period }) +
        (isFiltered.value ? ` · ${selectedDepartmentName.value}` : ''),
      headers: [t('export.metric'), t('export.value')],
      rows: [
        [t('kpi.satisfaction'), d.kpis.satisfaction.value],
        [t('kpi.enps'), d.kpis.enps.value],
        [t('export.enpsDelta'), d.kpis.enps.deltaVsLastMonth],
        [
          t('kpi.responseRate'),
          d.kpis.responseRate.percentage === null
            ? hidden
            : `${d.kpis.responseRate.percentage}% (${d.kpis.responseRate.responded}/${d.kpis.responseRate.total})`,
        ],
        [
          t('kpi.burnoutRisk'),
          d.kpis.burnoutRisk.percentage === null ? hidden : `${d.kpis.burnoutRisk.percentage}%`,
        ],
        [t('kpi.departmentsToWatch'), d.kpis.burnoutRisk.departmentsAtRisk],
        [
          t('export.sentiment'),
          d.kpis.sentiment === null
            ? hidden
            : `${d.kpis.sentiment.positive}% / ${d.kpis.sentiment.neutral}% / ${d.kpis.sentiment.negative}%`,
        ],
      ],
    },
    {
      title: t('trend.title'),
      headers: [
        t('export.month'),
        t('kpi.satisfaction'),
        t('kpi.enps'),
        t('kpi.responseRate'),
        t('kpi.burnoutRisk'),
      ],
      rows: d.kpis.trend.map((p) =>
        p.hasResponses
          ? [p.month, p.satisfaction, p.enps, p.responseRate, p.burnoutRisk]
          : [p.month, null, null, null, null],
      ),
    },
    {
      title: t('export.heatmapTitle'),
      headers: [
        t('departmentScores.department'),
        ...heatmapTopics.value.map(
          (topic) => topic.label[locale.value as Locale] || topic.label.th,
        ),
      ],
      rows: displayedHeatmapRows.value.map((row) => [
        departmentName(row.department),
        ...heatmapTopics.value.map((topic) => {
          const c = row.cells.find((cell) => cell.topicId === topic.id)
          return c ? show(c.score) : null
        }),
      ]),
    },
  ]
  if (departmentSummaryRows.value.length) {
    sections.push({
      title: t('departmentScores.title'),
      headers: [
        t('departmentScores.department'),
        t('departmentScores.responses'),
        t('departmentScores.average'),
        t('departmentScores.change'),
        t('departmentScores.forecast'),
        t('departmentScores.statusTitle'),
      ],
      rows: departmentSummaryRows.value.map((r) => [
        r.name,
        r.responded.suppressed ? hidden : `${r.responded.data}/${r.total ?? ''}`,
        show(r.score),
        r.change,
        r.forecast,
        r.status === 'unavailable' ? hidden : t(`departmentScores.status.${r.status}`),
      ]),
    })
  }
  if (d.alerts?.length) {
    sections.push({
      title: t('export.alertsTitle'),
      headers: [t('export.severity'), t('export.message')],
      rows: d.alerts.map((a) => [a.severity, a.message]),
    })
  }
  downloadCsv(`mt-sense-hr-${period || 'latest'}.csv`, toCsv(sections))
}

function goToTopic(topicId: string, department: dashboardApi.HeatmapRow['department']) {
  router.push({
    path: `/dashboard/topics/${topicId}`,
    query: {
      department: department.id,
      period: selectedPeriod.value || undefined,
      returnPeriod: selectedPeriod.value || undefined,
      returnDepartment: selectedDepartment.value,
    },
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
        <Button variant="secondary" :disabled="!data" @click="exportCsv">
          <Download :size="16" aria-hidden="true" />
          {{ t('common.export') }}
        </Button>
        <Button variant="secondary" @click="emailDialogOpen = true">
          <Mail :size="16" aria-hidden="true" />
          {{ t('common.sendEmail') }}
        </Button>
      </div>
    </div>

    <SendSummaryDialog
      v-model:open="emailDialogOpen"
      :period-id="selectedPeriod"
      :period-label="periodOptions.find((option) => option.value === selectedPeriod)?.label"
    />

    <LoadingSpinner v-if="loading" size="lg" />
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
          :description="t('dashboardHelp.enps')"
          :value="metricValue(data.kpis.enps.value)"
          :sublabel="data.kpis.enps.value === null ? metricNote : comparisonLabel"
          trend="up"
        />
        <KpiCard
          :label="t('kpi.satisfaction')"
          :description="t('dashboardHelp.satisfaction')"
          :value="metricValue(data.kpis.satisfaction.value, '/5')"
          :trend="data.kpis.satisfaction.trend ?? undefined"
          :sublabel="data.kpis.satisfaction.value === null ? metricNote : ''"
        />
        <KpiCard
          :label="t('kpi.burnoutRisk')"
          :description="t('dashboardHelp.burnout')"
          :value="metricValue(data.kpis.burnoutRisk.percentage, '%')"
          :sublabel="
            data.kpis.burnoutRisk.departmentsAtRisk === null
              ? metricNote
              : `${data.kpis.burnoutRisk.departmentsAtRisk} ${t('kpi.departmentsToWatch')}`
          "
        />
        <KpiCard
          :label="t('kpi.responseRate')"
          :description="t('dashboardHelp.responseRate')"
          :value="metricValue(data.kpis.responseRate.percentage, '%')"
          :sublabel="data.kpis.dataState === 'suppressed' ? metricNote : responseCountLabel"
        />
      </div>

      <section class="panel trend-panel">
        <div class="trend-heading">
          <h2>
            {{ t('trend.title') }}<span v-if="isFiltered"> · {{ selectedDepartmentName }}</span>
            <InfoTooltip
              :label="t('trend.title')"
              :text="
                [
                  t(trendForecast ? 'trend.methodNote' : 'trend.insufficientForecast'),
                  selectedTrendMetric === 'responseRate' ? t('trend.responseRateNote') : '',
                ]
                  .filter(Boolean)
                  .join('\n\n')
              "
            />
          </h2>
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
      </section>

      <div class="department-alerts-grid">
        <section class="panel department-summary-panel">
          <h2>
            {{ t('departmentScores.title') }}
            <InfoTooltip
              :label="t('departmentScores.title')"
              :text="
                [t('departmentScores.headcountNote'), t('departmentScores.methodNote')].join('\n\n')
              "
            />
          </h2>
          <DepartmentSummaryTable v-if="data.departmentSummary" :rows="departmentSummaryRows" />
          <p v-else class="wordcloud-error">{{ t('common.loadError') }}</p>
        </section>
        <section class="panel alerts-panel">
          <DashboardAlerts
            :alerts="data.alerts"
            :departments="data.heatmap.rows.map((row) => row.department)"
          />
        </section>
      </div>

      <section class="panel heatmap-panel">
        <h2>
          {{ t('heatmap.title') }}
          <InfoTooltip
            :label="t('heatmap.title')"
            :text="[t('dashboardHelp.heatmap'), t('heatmap.filterScope')].join('\n\n')"
          />
        </h2>
        <HeatmapGrid
          v-if="heatmapTopics.length"
          :topics="heatmapTopics"
          :rows="displayedHeatmapRows"
          compact
          @cell-click="goToTopic"
        />
        <p v-else class="heatmap-scope">{{ t('heatmap.noVisibleTopics') }}</p>
      </section>

      <section v-if="data.extraQuestions.length > 0" class="panel">
        <h2>
          {{ t('periods.extraQuestions.resultsTitle') }}
          <InfoTooltip
            :label="t('periods.extraQuestions.resultsTitle')"
            :text="t('dashboardHelp.extraQuestions')"
          />
        </h2>
        <ul class="extra-question-results">
          <li v-for="q in data.extraQuestions" :key="q.key">
            <span class="eq-label">{{ locale === 'th' ? q.label.th : q.label.en }}</span>
            <span class="eq-value">
              {{ q.average }}{{ q.type === 'enps_0_10' ? '/10' : '/5' }}
              <span class="eq-count"
                >({{ q.respondentCount }} {{ t('drilldown.respondents') }})</span
              >
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
          <h2>
            {{ t('kpi.sentimentDistribution') }}
            <InfoTooltip
              :label="t('kpi.sentimentDistribution')"
              :text="t('dashboardHelp.sentiment')"
            />
          </h2>
          <SentimentBar :sentiment="data.kpis.sentiment" />
          <hr class="rule" />
          <h2>
            {{ t('wordcloud.title') }}
            <InfoTooltip :label="t('wordcloud.title')" :text="t('dashboardHelp.terms')" />
          </h2>
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

.trend-heading h2 {
  margin: 0;
}
.trend-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
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
.trend-metric:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.trend-metric.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}
.trend-metric:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

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
.alerts-panel {
  min-width: 0;
  height: 100%;
}

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

.department-summary-panel {
  min-width: 0;
}
.insight-unavailable {
  min-width: 0;
}
.wordcloud-panel {
  min-width: 0;
}
.wordcloud-panel .rule {
  margin: var(--space-5) 0;
}

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
  .department-alerts-grid {
    grid-template-columns: 1fr;
  }
  .insight-sentiment-grid {
    grid-template-columns: 1fr;
  }
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
