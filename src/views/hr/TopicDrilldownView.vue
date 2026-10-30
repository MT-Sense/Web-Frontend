<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter, type LocationQueryRaw } from 'vue-router'
import { ArrowLeft, Download, ListChecks } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import TopicSummaryPanel from '@/components/dashboard/TopicSummaryPanel.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'
import * as periodsApi from '@/api/periods'
import * as departmentsApi from '@/api/departments'
import { ApiError } from '@/api/client'
import { downloadCsv, toCsv, type CsvSection } from '@/utils/csv'
import type { LocalizedText, Locale } from '@/types/common'
import type { TopicDrilldown } from '@/types/topic'

const props = defineProps<{ id?: string }>()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const queryString = (key: string) =>
  typeof route.query[key] === 'string' ? (route.query[key] as string) : ''
const {
  data: catalog,
  loading: catalogLoading,
  error: catalogError,
  reload: reloadCatalog,
} = useAsyncData(async () => {
  const [topics, periods, departments] = await Promise.all([
    dashboardApi.topics(),
    periodsApi.list(),
    departmentsApi.list(),
  ])
  return { topics, periods, departments }
})
const periodOptions = computed(() =>
  (catalog.value?.periods ?? []).map((period) => ({
    value: period.id,
    label: `${period.year}-${String(period.month).padStart(2, '0')}`,
  })),
)
const periodModel = computed({
  get: () => queryString('period') || periodOptions.value[0]?.value || '',
  set: (period) => {
    void router.replace({ query: { ...route.query, period } })
  },
})
const selectedDepartment = computed(() =>
  queryString('department') === 'all' ? '' : queryString('department'),
)
const departmentModel = computed({
  get: () => selectedDepartment.value,
  set: (department) => {
    const query: LocationQueryRaw = { ...route.query, period: periodModel.value }
    if (department) query.department = department
    else delete query.department
    void router.replace({ query })
  },
})
const topicModel = computed({
  get: () => props.id ?? '',
  set: (id) => {
    void router.replace({
      path: id ? `/dashboard/topics/${encodeURIComponent(id)}` : '/dashboard/topics',
      query: { ...route.query, period: periodModel.value },
    })
  },
})
type TopicResult =
  | {
      key: string
      kind: 'ready'
      detail: TopicDrilldown
    }
  | {
      key: string
      kind: 'suppressed' | 'analysis_pending' | 'not_found'
      label?: LocalizedText
    }
const selectionKey = computed(() =>
  JSON.stringify([props.id, periodModel.value, selectedDepartment.value]),
)
async function loadDrilldown(): Promise<TopicResult | null> {
  const id = props.id,
    period = periodModel.value,
    department = selectedDepartment.value
  const key = selectionKey.value
  if (!id || !period) return null
  try {
    return {
      key,
      kind: 'ready',
      detail: await dashboardApi.topicDrilldown(id, period, department || undefined),
    }
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 404) throw err
    const reason = err.body.reason
    const label = err.body.label as LocalizedText | undefined
    return {
      key,
      kind: reason === 'analysis_pending' || reason === 'suppressed' ? reason : 'not_found',
      label,
    }
  }
}
const { data: result, loading, error, reload } = useAsyncData(loadDrilldown)
watch(selectionKey, () => {
  void reload()
})
const currentResult = computed(() =>
  result.value?.key === selectionKey.value ? result.value : null,
)
const drilldown = computed(() =>
  currentResult.value?.kind === 'ready' ? currentResult.value.detail : null,
)
const knownLabels = ref<Record<string, LocalizedText>>({})
watch(result, (value) => {
  if (!value || value.key !== selectionKey.value || !props.id) return
  const label = value.kind === 'ready' ? value.detail.label : value.label
  if (label) knownLabels.value[props.id] = label
})
// The heatmap includes emerging topics that are not in the fixed taxonomy.
const {
  data: availableTopics,
  loading: topicsLoading,
  error: topicsError,
  reload: reloadTopics,
} = useAsyncData(async () => {
  const period = periodModel.value
  return period ? { period, topics: (await dashboardApi.heatmap(period)).topics } : null
})
watch(periodModel, () => {
  void reloadTopics()
})
const topicOptions = computed(() => {
  const topics = new Map((catalog.value?.topics ?? []).map((topic) => [topic.id, topic]))
  if (availableTopics.value?.period === periodModel.value) {
    for (const topic of availableTopics.value.topics) topics.set(topic.id, topic)
  }
  if (props.id && !topics.has(props.id)) {
    topics.set(props.id, {
      id: props.id,
      label: knownLabels.value[props.id] ?? {
        th: t('drilldown.selectedTopic'),
        en: t('drilldown.selectedTopic'),
      },
    })
  }
  return [...topics.values()]
})
const localLabel = (label?: LocalizedText) => label?.[locale.value as Locale] || label?.th || ''
const topicName = computed(() =>
  localLabel(topicOptions.value.find((topic) => topic.id === props.id)?.label),
)
const periodLabel = computed(
  () => periodOptions.value.find((period) => period.value === periodModel.value)?.label ?? '',
)
const departmentName = computed(() => {
  if (!selectedDepartment.value) return t('drilldown.allDepartments')
  if (selectedDepartment.value === '__unassigned__') return t('heatmap.unassigned')
  return (
    catalog.value?.departments.find((department) => department.id === selectedDepartment.value)
      ?.name ?? t('drilldown.unknownDepartment')
  )
})
const unknownDepartment = computed(
  () =>
    !!selectedDepartment.value &&
    selectedDepartment.value !== '__unassigned__' &&
    !catalog.value?.departments.some((department) => department.id === selectedDepartment.value),
)
const dashboardTarget = computed(() => ({
  path: '/dashboard',
  query: {
    period: queryString('returnPeriod') || periodModel.value || undefined,
    department: queryString('returnDepartment') || selectedDepartment.value || undefined,
  },
}))
const actionTarget = computed(() => ({
  path: '/action-items',
  query: {
    ...route.query,
    topic: props.id,
    period: periodModel.value,
    department: selectedDepartment.value || undefined,
  },
}))
const loadingDetail = computed(
  () =>
    !!props.id && !!periodModel.value && (loading.value || (!currentResult.value && !error.value)),
)
const trendPoints = computed(() =>
  (drilldown.value?.trend ?? []).map((point) => {
    const [year, month] = point.month.split('-').map(Number)
    const label = new Intl.DateTimeFormat(locale.value === 'th' ? 'th-TH-u-ca-gregory' : 'en-GB', {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year!, month! - 1, 1)))
    return { label, value: point.score }
  }),
)
const metricCards = computed(() => [
  {
    key: 'score',
    label: t('drilldown.topicScore'),
    value: drilldown.value ? `${drilldown.value.score.toFixed(1)}/5` : '',
    help: t('drilldown.scoreHelp'),
  },
  {
    key: 'average',
    label: t('drilldown.companyAverage'),
    value: drilldown.value ? `${drilldown.value.companyAverage.toFixed(1)}/5` : '',
    help: t('drilldown.averageHelp'),
  },
  {
    key: 'responses',
    label: t('drilldown.mentionedResponses'),
    value: drilldown.value?.respondentCount ?? '',
    help: t('drilldown.responseHelp'),
  },
  {
    key: 'share',
    label: t('drilldown.percentageTagged'),
    value: drilldown.value ? `${drilldown.value.percentageTagged}%` : '',
    help: t('drilldown.shareHelp'),
  },
])
function exportCsv() {
  const detail = drilldown.value
  if (!detail || loading.value) return
  const sections: CsvSection[] = [
    {
      title:
        t('export.topicTitle', { topic: topicName.value, period: periodLabel.value }) +
        ` · ${departmentName.value}`,
      headers: [t('export.metric'), t('export.value')],
      rows: [
        [t('drilldown.topicScore'), detail.score],
        [t('drilldown.companyAverage'), detail.companyAverage],
        [t('drilldown.mentionedResponses'), detail.respondentCount],
        [t('drilldown.scopeResponses'), detail.scopeResponseCount],
        [t('drilldown.percentageTagged'), `${detail.percentageTagged}%`],
        [
          t('export.sentiment'),
          `${detail.sentiment.positive}% / ${detail.sentiment.neutral}% / ${detail.sentiment.negative}%`,
        ],
      ],
    },
    {
      title: t('drilldown.trendTitle'),
      headers: [t('export.month'), t('drilldown.topicScore')],
      rows: detail.trend.map((point) => [point.month, point.score]),
    },
  ]
  // Export aggregate metrics only; never include employee comments.
  downloadCsv(`mt-sense-topic-${props.id}-${periodLabel.value}.csv`, toCsv(sections))
}
</script>

<template>
  <HrLayout :breadcrumb="t('drilldown.title')">
    <section class="panel topic-controls">
      <header class="card-header">
        <h1 class="panel-title">
          {{ t('drilldown.title') }}
          <InfoTooltip :label="t('drilldown.title')" :text="t('drilldown.pageHelp')" />
        </h1>
        <div class="buttons">
          <Button variant="secondary" as-child
            ><RouterLink :to="dashboardTarget"
              ><ArrowLeft :size="16" aria-hidden="true" />{{
                t('drilldown.backDashboard')
              }}</RouterLink
            ></Button
          >
          <Button variant="secondary" :disabled="!drilldown || loading" @click="exportCsv"
            ><Download :size="16" aria-hidden="true" />{{ t('common.export') }}</Button
          >
        </div>
      </header>
      <Alert v-if="catalogError" variant="destructive"
        ><AlertDescription
          >{{ t('common.loadError') }}
          <Button variant="link" @click="reloadCatalog">{{
            t('common.retry')
          }}</Button></AlertDescription
        ></Alert
      >
      <div class="filters" :aria-busy="catalogLoading">
        <label
          >{{ t('drilldown.round')
          }}<LoadingSkeleton v-if="catalogLoading" variant="control" /><select
            v-else
            v-model="periodModel"
            :disabled="catalogError || !periodOptions.length"
          >
            <option v-if="catalogError" :value="periodModel">{{ t('common.loadError') }}</option>
            <option v-else-if="!periodOptions.length" value="">{{ t('periods.empty') }}</option>
            <option v-for="period in periodOptions" :key="period.value" :value="period.value">
              {{ period.label }}
            </option>
          </select></label
        >
        <label
          >{{ t('drilldown.topic')
          }}<LoadingSkeleton v-if="catalogLoading" variant="control" /><select
            v-else
            v-model="topicModel"
            :disabled="catalogError || !periodModel"
          >
            <option value="" disabled>{{ t('drilldown.chooseTopic') }}</option>
            <option v-for="topic in topicOptions" :key="topic.id" :value="topic.id">
              {{ localLabel(topic.label) }}
            </option>
          </select></label
        >
        <label
          >{{ t('drilldown.department')
          }}<LoadingSkeleton v-if="catalogLoading" variant="control" /><select
            v-else
            v-model="departmentModel"
            :disabled="catalogError || !periodModel"
          >
            <option value="">{{ t('drilldown.allDepartments') }}</option>
            <option
              v-for="department in catalog?.departments ?? []"
              :key="department.id"
              :value="department.id"
            >
              {{ department.name }}
            </option>
            <option value="__unassigned__">{{ t('heatmap.unassigned') }}</option>
            <option v-if="unknownDepartment" :value="selectedDepartment">
              {{ t('drilldown.unknownDepartment') }}
            </option>
          </select></label
        >
        <span v-if="catalogLoading" class="visually-hidden" role="status">{{
          t('common.loading')
        }}</span>
      </div>
      <p v-if="props.id && !catalogLoading && !catalogError" class="selection-context">
        <strong>{{ topicName }}</strong
        ><span>{{ periodLabel }}</span
        ><span>{{ departmentName }}</span>
      </p>
      <p v-else class="hint">{{ t('drilldown.selectionHelp') }}</p>
      <Alert v-if="topicsError && periodModel"
        ><AlertDescription
          >{{ t('drilldown.topicOptionsError') }}
          <Button variant="link" @click="reloadTopics">{{
            t('common.retry')
          }}</Button></AlertDescription
        ></Alert
      >
      <span v-else-if="topicsLoading && !catalogLoading" class="visually-hidden" role="status">{{
        t('common.loading')
      }}</span>
    </section>

    <section
      v-if="!catalogLoading && !catalogError && !periodOptions.length"
      class="panel empty-state"
    >
      <h2>{{ t('periods.empty') }}</h2>
      <p>{{ t('drilldown.noPeriodsHelp') }}</p>
    </section>
    <section v-else-if="!props.id && !catalogLoading && !catalogError" class="panel empty-state">
      <h2>{{ t('drilldown.chooseTopic') }}</h2>
      <p>{{ t('drilldown.selectionHelp') }}</p>
    </section>

    <template v-if="loadingDetail || drilldown">
      <div class="metric-grid" :aria-busy="loadingDetail">
        <section v-for="metric in metricCards" :key="metric.key" class="panel metric-card">
          <h2>{{ metric.label }}<InfoTooltip :label="metric.label" :text="metric.help" /></h2>
          <strong
            ><LoadingSkeleton v-if="loadingDetail" variant="value" /><template v-else>{{
              metric.value
            }}</template></strong
          >
          <p
            v-if="
              !loadingDetail && drilldown && (metric.key === 'responses' || metric.key === 'share')
            "
            class="hint"
          >
            {{ t('drilldown.outOfResponses', { count: drilldown.scopeResponseCount }) }} ·
            {{ departmentName }}
          </p>
        </section>
        <span v-if="loadingDetail" class="visually-hidden" role="status">{{
          t('common.loading')
        }}</span>
      </div>
      <section v-if="loadingDetail" class="panel"><LoadingSpinner size="lg" /></section>
    </template>
    <Alert v-if="!loading && error" variant="destructive"
      ><AlertDescription
        >{{ t('common.loadError') }}
        <Button variant="link" @click="reload">{{ t('common.retry') }}</Button></AlertDescription
      ></Alert
    >
    <section
      v-else-if="!loading && currentResult && currentResult.kind !== 'ready'"
      class="panel unavailable-state"
    >
      <h2 class="panel-title">
        {{
          t(
            currentResult.kind === 'analysis_pending'
              ? 'drilldown.analysisPending'
              : currentResult.kind === 'suppressed'
                ? 'drilldown.suppressed'
                : 'drilldown.notFound',
          )
        }}<InfoTooltip
          v-if="currentResult.kind === 'suppressed'"
          :label="t('drilldown.suppressed')"
          :text="t('drilldown.privacyHelp')"
        />
      </h2>
      <p>
        {{
          t(
            currentResult.kind === 'analysis_pending'
              ? 'drilldown.pendingHelp'
              : 'drilldown.unavailableHelp',
          )
        }}
      </p>
      <Button variant="secondary" @click="reload">{{ t('common.retry') }}</Button>
    </section>

    <template v-if="drilldown && !loading">
      <section class="panel trend-panel">
        <h2 class="panel-title">
          {{ t('drilldown.trendTitle')
          }}<InfoTooltip :label="t('drilldown.trendTitle')" :text="t('drilldown.trendHelp')" />
        </h2>
        <TrendLineChart
          :points="trendPoints"
          :label="t('drilldown.topicScore')"
          :min="1"
          :max="5"
          format="score"
          :empty-text="t('drilldown.noTrend')"
          forecast-label=""
        />
      </section>
      <div class="detail-grid">
        <section class="panel sentiment-panel">
          <h2 class="panel-title">
            {{ t('drilldown.sentimentTitle')
            }}<InfoTooltip
              :label="t('drilldown.sentimentTitle')"
              :text="t('drilldown.sentimentHelp')"
            />
          </h2>
          <SentimentBar :sentiment="drilldown.sentiment" />
        </section>
        <section class="panel quotes-panel">
          <h2 class="panel-title">
            {{ t('drilldown.sampleQuotes')
            }}<InfoTooltip :label="t('drilldown.sampleQuotes')" :text="t('drilldown.quotesHelp')" />
          </h2>
          <ul v-if="drilldown.sampleQuotes.length" class="quotes">
            <li v-for="(quote, index) in drilldown.sampleQuotes" :key="index">
              <blockquote>{{ quote }}</blockquote>
            </li>
          </ul>
          <p v-else class="hint">{{ t('drilldown.noQuotes') }}</p>
        </section>
      </div>
      <TopicSummaryPanel :key="selectionKey" :source="drilldown" />
      <section class="panel follow-up">
        <div>
          <h2 class="panel-title">{{ t('drilldown.actionsTitle') }}</h2>
          <p class="hint">{{ t('drilldown.actionsHelp') }}</p>
        </div>
        <Button as-child
          ><RouterLink :to="actionTarget"
            ><ListChecks :size="16" aria-hidden="true" />{{
              t('drilldown.viewActions')
            }}</RouterLink
          ></Button
        >
      </section>
    </template>
  </HrLayout>
</template>

<style scoped>
.card-header,
.buttons,
.follow-up {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.card-header {
  margin-bottom: var(--space-4);
}
.card-header .panel-title,
.follow-up .panel-title {
  margin: 0;
}
.buttons {
  justify-content: flex-start;
}
.filters {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-4);
}
label {
  display: grid;
  gap: var(--space-2);
  min-width: 0;
  font-size: var(--font-size-sm);
}
select {
  width: 100%;
  min-width: 0;
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
}
select:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.selection-context {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  margin: var(--space-4) 0 0;
  font-size: var(--font-size-sm);
}
.selection-context span {
  padding-inline-start: var(--space-3);
  border-inline-start: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-4);
}
.metric-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-width: 0;
}
.metric-card h2 {
  min-height: 3em;
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-muted);
}
.metric-card strong {
  font-size: var(--font-size-xxl);
  font-variant-numeric: tabular-nums;
  min-height: 1.5em;
}
.metric-card .hint {
  margin-top: auto;
}
.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr);
  gap: var(--space-4);
}
.trend-panel :deep(svg) {
  max-height: calc(var(--space-7) * 7);
}
.panel-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
p {
  margin: var(--space-3) 0 0;
  line-height: 1.7;
}
.hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.quotes {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: var(--space-3);
}
blockquote {
  margin: 0;
  padding: var(--space-3) var(--space-4);
  border-inline-start: var(--space-1) solid var(--color-accent-200);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.empty-state,
.unavailable-state {
  padding-block: var(--space-6);
}
.empty-state h2 {
  margin: 0;
  font-size: var(--font-size-lg);
}
.unavailable-state > button {
  margin-top: var(--space-4);
}
@media (max-width: 1100px) {
  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .filters,
  .metric-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .card-header,
  .buttons,
  .follow-up {
    align-items: stretch;
  }
  .buttons,
  .buttons > *,
  .follow-up > a {
    width: 100%;
  }
}
</style>
