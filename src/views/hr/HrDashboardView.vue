<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Download, Mail } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
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
      <div class="kpi-card sentiment-card panel">
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
