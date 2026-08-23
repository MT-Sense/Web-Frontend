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
import AiInsightPanel from '@/components/dashboard/AiInsightPanel.vue'
import UrgentIssuesList from '@/components/dashboard/UrgentIssuesList.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'
import * as periodsApi from '@/api/periods'

const { t } = useI18n()
const router = useRouter()

const selectedPeriod = ref('')
const selectedDepartment = ref('all')

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

async function loadDashboard() {
  const period = selectedPeriod.value || undefined
  const [kpis, heatmap, wordCloud, insight] = await Promise.all([
    dashboardApi.hrKpis(period),
    dashboardApi.heatmap(period),
    dashboardApi.wordCloud(period),
    dashboardApi.insight(period),
  ])
  return { kpis, heatmap, wordCloud, insight }
}

const { data, loading, error, reload } = useAsyncData(loadDashboard)

watch(selectedPeriod, () => {
  if (selectedPeriod.value) reload()
})

const departmentOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  ...(data.value?.heatmap.rows.map((r) => ({ value: r.department.id, label: r.department.name })) ?? []),
])

const isFiltered = computed(() => selectedDepartment.value !== 'all')

const trendPoints = computed(() =>
  (data.value?.kpis.trend ?? []).map((p) => ({ label: p.month.slice(5), a: p.enps, b: p.satisfaction })),
)

function goToTopic(topicId: string) {
  router.push(`/dashboard/topics/${topicId}`)
}

function filterFeedByTag(topicId: string) {
  router.push({ path: '/voices', query: { tag: topicId } })
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

    <p v-if="loading && !data">{{ t('common.loading') }}</p>
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
          :sublabel="`+${data.kpis.enps.deltaVsLastMonth} vs last month`"
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
        <div class="kpi-card sentiment-card panel">
          <div class="label">{{ t('kpi.sentimentDistribution') }}</div>
          <SentimentBar :sentiment="data.kpis.sentiment" />
        </div>
      </div>

      <section class="panel">
        <h2>eNPS · {{ t('kpi.satisfaction') }}</h2>
        <TrendLineChart :points="trendPoints" series-a-label="eNPS" :series-b-label="t('kpi.satisfaction')" />
      </section>

      <div class="two-col">
        <AiInsightPanel :insight="data.insight.insight" />
        <UrgentIssuesList :issues="data.insight.urgentIssues" />
      </div>

      <section class="panel">
        <h2>{{ t('heatmap.title') }}</h2>
        <HeatmapGrid :topics="data.heatmap.topics" :rows="data.heatmap.rows" @cell-click="goToTopic" />
      </section>

      <section class="panel">
        <h2>{{ t('wordcloud.title') }}</h2>
        <WordCloud :terms="data.wordCloud" @term-click="filterFeedByTag" />
      </section>
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
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
}

.kpi-card {
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.sentiment-card .label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
}

.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 1200px) {
  .kpi-row {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-col {
    grid-template-columns: 1fr;
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
