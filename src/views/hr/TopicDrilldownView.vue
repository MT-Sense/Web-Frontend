<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Download } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import SingleLineChart from '@/components/charts/SingleLineChart.vue'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'
import ActionItemsManager from '@/components/dashboard/ActionItemsManager.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'
import * as periodsApi from '@/api/periods'
import { ApiError } from '@/api/client'
import { downloadCsv, toCsv, type CsvSection } from '@/utils/csv'
import type { Locale } from '@/types/common'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()
const selectedDepartment = computed(() => typeof route.query.department === 'string' ? route.query.department : undefined)
const selectedPeriod = computed(() => typeof route.query.period === 'string' ? route.query.period : undefined)

/** Why the backend hid this topic: the n<5 rule, or comments still waiting for AI analysis. */
const unavailable = ref<{ reason: 'suppressed' | 'analysis_pending'; pending: number } | null>(null)

async function loadDrilldown() {
  unavailable.value = null
  try {
    return await dashboardApi.topicDrilldown(props.id, selectedPeriod.value, selectedDepartment.value)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && typeof err.body.reason === 'string') {
      unavailable.value = {
        reason: err.body.reason === 'analysis_pending' ? 'analysis_pending' : 'suppressed',
        pending: Number(err.body.pendingAnalysis ?? 0),
      }
      return null
    }
    throw err
  }
}

const { data: topicList } = useAsyncData(() => dashboardApi.topics())
const { data: periods } = useAsyncData(() => periodsApi.list())
const {
  data: drilldown,
  loading,
  error,
  reload,
} = useAsyncData(loadDrilldown)
watch(() => [props.id, selectedPeriod.value, selectedDepartment.value], reload)

const periodOptions = computed(() =>
  (periods.value ?? []).map((p) => ({ value: p.id, label: `${p.year}-${String(p.month).padStart(2, '0')}` })),
)
// The backend defaults to the latest round; show that as selected when no ?period is set.
const periodModel = computed({
  get: () => selectedPeriod.value ?? periodOptions.value[0]?.value ?? '',
  set: (period: string) => router.replace({ query: { ...route.query, period } }),
})
const topicModel = computed({
  get: () => props.id,
  set: (id: string) => router.replace({ path: `/dashboard/topics/${id}`, query: route.query }),
})
function clearDepartment() {
  const query = { ...route.query }
  delete query.department
  router.replace({ query })
}

const topic = computed(() => {
  const catalogTopic = topicList.value?.find((item) => item.id === props.id)
  if (catalogTopic) {
    return catalogTopic
  }
  if (!drilldown.value) {
    return undefined
  }

  return { id: props.id, label: drilldown.value.label }
})
const departmentName = computed(() => drilldown.value?.departmentId === '__unassigned__'
  ? t('heatmap.unassigned')
  : drilldown.value?.departmentName)
const breadcrumb = computed(() => {
  const topicName = topic.value?.label[locale.value as Locale] ?? ''
  return departmentName.value ? `${topicName} · ${departmentName.value}` : topicName
})

const trendPoints = computed(
  () => drilldown.value?.trend.map((p) => ({ label: p.month.slice(5), value: p.score })) ?? [],
)
/** Scores and trend only. Sample comments are deliberately left out of the file so
 * employee text never leaves the system as a download. */
function exportCsv() {
  const d = drilldown.value
  if (!d) return
  const name = topic.value?.label[locale.value as Locale] || topic.value?.label.th || props.id
  const period = periodOptions.value.find((o) => o.value === periodModel.value)?.label ?? ''
  const sections: CsvSection[] = [
    {
      title: t('export.topicTitle', { topic: name, period }) + (departmentName.value ? ` · ${departmentName.value}` : ''),
      headers: [t('export.metric'), t('export.value')],
      rows: [
        [t('drilldown.topicScore'), d.score],
        [t('drilldown.companyAverage'), d.companyAverage],
        [t('drilldown.respondents'), d.respondentCount],
        [t('drilldown.percentageTagged'), `${d.percentageTagged}%`],
        [t('export.sentiment'), `${d.sentiment.positive}% / ${d.sentiment.neutral}% / ${d.sentiment.negative}%`],
      ],
    },
    { title: t('drilldown.trendTitle'), headers: [t('export.month'), t('drilldown.topicScore')], rows: d.trend.map((p) => [p.month, p.score]) },
  ]
  if (d.subIssues.length) {
    sections.push({
      title: t('drilldown.subIssues'),
      headers: [t('export.issue'), '%'],
      rows: d.subIssues.map((i) => [i.label[locale.value as Locale] || i.label.th, i.percentage]),
    })
  }
  downloadCsv(`mt-sense-topic-${props.id}-${period || 'latest'}.csv`, toCsv(sections))
}
</script>

<template>
  <HrLayout :breadcrumb="breadcrumb">
    <div class="toolbar">
      <label>
        {{ t('drilldown.round') }}
        <select v-model="periodModel">
          <option v-for="option in periodOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label>
        {{ t('drilldown.topic') }}
        <select v-model="topicModel">
          <option v-for="item in topicList ?? []" :key="item.id" :value="item.id">{{ item.label[locale as Locale] || item.label.th }}</option>
        </select>
      </label>
      <Button v-if="selectedDepartment" variant="secondary" size="sm" @click="clearDepartment">{{ t('drilldown.allDepartments') }}</Button>
    </div>

    <p v-if="loading">{{ t('common.loading') }}</p>
    <Alert v-else-if="unavailable?.reason === 'analysis_pending'">
      <AlertDescription>{{ t('drilldown.analysisPending', { count: unavailable.pending }) }}</AlertDescription>
    </Alert>
    <Alert v-else-if="unavailable">
      <AlertDescription>{{ t('drilldown.suppressed') }}</AlertDescription>
    </Alert>
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>
        {{ t('common.loadError') }}
        <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
      </AlertDescription>
    </Alert>
    <div v-else-if="drilldown" class="drilldown">
      <p v-if="drilldown.departmentId" class="scope-label">
        {{ t('drilldown.departmentScope', { name: departmentName }) }}
      </p>
      <section class="panel score-panel">
        <div class="score-block">
          <span class="score-value">{{ drilldown.score.toFixed(1) }}/5</span>
          <span class="score-label">{{ t('drilldown.topicScore') }}</span>
        </div>
        <div class="stats">
          <div class="stat">
            <span class="stat-value">{{ drilldown.companyAverage.toFixed(1) }}/5</span>
            <span class="stat-label">{{ t('drilldown.companyAverage') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ drilldown.respondentCount }}</span>
            <span class="stat-label">{{ t('drilldown.respondents') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ drilldown.percentageTagged }}%</span>
            <span class="stat-label">{{ t('drilldown.percentageTagged') }}</span>
          </div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-header">
          <h2>{{ t('drilldown.trendTitle') }}</h2>
          <Button variant="secondary" size="sm" @click="exportCsv">
            <Download :size="15" aria-hidden="true" />
            {{ t('common.export') }}
          </Button>
        </div>
        <SingleLineChart :points="trendPoints" :max="5" />
      </section>

      <div class="two-col">
        <section class="panel">
          <h2 v-if="drilldown.subIssues.length">{{ t('drilldown.subIssues') }}</h2>
          <div v-if="drilldown.subIssues.length" class="sub-issues">
            <ProgressBarLabeled
              v-for="issue in drilldown.subIssues"
              :key="issue.id"
              :label="issue.label[locale as Locale]"
              :percentage="issue.percentage"
            />
          </div>
          <h2 v-else>{{ t('kpi.sentimentDistribution') }}</h2>
          <SentimentBar :sentiment="drilldown.sentiment" />
        </section>

        <section class="panel">
          <h2>{{ t('drilldown.sampleQuotes') }}</h2>
          <ul class="quotes">
            <li v-for="(quote, i) in drilldown.sampleQuotes" :key="i">"{{ quote }}"</li>
          </ul>
          <p v-if="!drilldown.sampleQuotes.length">{{ t('drilldown.noQuotes') }}</p>
        </section>
      </div>

      <ActionItemsManager v-if="!drilldown.departmentId" :topic-id="id" />
    </div>
  </HrLayout>
</template>

<style scoped>
.drilldown {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.scope-label {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-3);
}

.panel h2 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.score-panel {
  display: flex;
  align-items: center;
  gap: var(--space-6);
  flex-wrap: wrap;
}

.score-block {
  display: flex;
  flex-direction: column;
}

.score-value {
  font-size: var(--font-size-xxl);
  font-weight: 700;
}

.score-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.stats {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.sub-issues {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.quotes {
  margin: 0;
  padding-left: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  font-style: italic;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.toolbar label {
  display: grid;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--color-text-muted);
}

.toolbar select {
  height: 36px;
  min-width: 160px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 var(--space-2);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 400;
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .panel-header {
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .stats {
    gap: var(--space-4);
  }
}
</style>
