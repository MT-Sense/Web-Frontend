<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import HrLayout from '@/layouts/HrLayout.vue'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import DropdownSelect from '@/components/common/DropdownSelect.vue'
import KpiCard from '@/components/kpi/KpiCard.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import TrendLineChart from '@/components/charts/TrendLineChart.vue'
import HeatmapGrid from '@/components/charts/HeatmapGrid.vue'
import WordCloud from '@/components/charts/WordCloud.vue'
import AiInsightPanel from '@/components/dashboard/AiInsightPanel.vue'
import UrgentIssuesList from '@/components/dashboard/UrgentIssuesList.vue'
import { hrKpis } from '@/mocks/kpis'
import { aiInsight, urgentIssues, wordCloud } from '@/mocks/insights'
import { topics } from '@/mocks/topics'
import { departments } from '@/mocks/departments'
import type { Locale } from '@/types/common'

const { t, locale } = useI18n()
const router = useRouter()

const selectedMonth = ref('2026-08')
const selectedDepartment = ref('all')

const monthOptions = computed(() =>
  hrKpis.trend.map((p) => ({ value: p.month, label: p.month })),
)
const departmentOptions = computed(() => [
  { value: 'all', label: t('common.all') },
  ...departments.map((d) => ({ value: d.id, label: d.name[locale.value as Locale] })),
])

const isFiltered = computed(() => selectedDepartment.value !== 'all')

const trendPoints = computed(() =>
  hrKpis.trend.map((p) => ({ label: p.month.slice(5), a: p.enps, b: p.satisfaction })),
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
        <DropdownSelect v-model="selectedMonth" :options="monthOptions" />
        <DropdownSelect v-model="selectedDepartment" :options="departmentOptions" />
      </div>
      <div class="actions">
        <button type="button" class="btn">{{ t('common.export') }}</button>
        <button type="button" class="btn">{{ t('common.sendEmail') }}</button>
      </div>
    </div>

    <PrivacyBanner v-if="isFiltered" variant="filters-active" />

    <div class="kpi-row">
      <KpiCard
        :label="t('kpi.enps')"
        :value="String(hrKpis.enps.value)"
        :sublabel="`+${hrKpis.enps.deltaVsLastMonth} vs last month`"
        trend="up"
      />
      <KpiCard
        :label="t('kpi.satisfaction')"
        :value="`${hrKpis.satisfaction.value}/5`"
        :trend="hrKpis.satisfaction.trend"
      />
      <KpiCard
        :label="t('kpi.burnoutRisk')"
        :value="`${hrKpis.burnoutRisk.percentage}%`"
        :sublabel="`${hrKpis.burnoutRisk.departmentsAtRisk} ${t('kpi.departmentsToWatch')}`"
      />
      <KpiCard
        :label="t('kpi.responseRate')"
        :value="`${hrKpis.responseRate.percentage}%`"
        :sublabel="`${hrKpis.responseRate.responded}/${hrKpis.responseRate.total}`"
      />
      <div class="kpi-card sentiment-card">
        <div class="label">{{ t('kpi.sentimentDistribution') }}</div>
        <SentimentBar :sentiment="hrKpis.sentiment" />
      </div>
    </div>

    <section class="panel">
      <h2>eNPS · {{ t('kpi.satisfaction') }}</h2>
      <TrendLineChart :points="trendPoints" series-a-label="eNPS" :series-b-label="t('kpi.satisfaction')" />
    </section>

    <div class="two-col">
      <AiInsightPanel :insight="aiInsight" />
      <UrgentIssuesList :issues="urgentIssues" />
    </div>

    <section class="panel">
      <h2>{{ t('heatmap.title') }}</h2>
      <HeatmapGrid :topics="topics" @cell-click="goToTopic" />
    </section>

    <section class="panel">
      <h2>{{ t('wordcloud.title') }}</h2>
      <WordCloud :terms="wordCloud" @term-click="filterFeedByTag" />
    </section>
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

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  cursor: pointer;
}

.btn:hover {
  background: var(--color-bg);
}

.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-3);
}

.kpi-card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
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

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.panel h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-md);
}

.two-col {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
