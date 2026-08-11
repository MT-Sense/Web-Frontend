<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ExecutiveLayout from '@/layouts/ExecutiveLayout.vue'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import DropdownSelect from '@/components/common/DropdownSelect.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import DecisionItemsList from '@/components/dashboard/DecisionItemsList.vue'
import { executiveHealth } from '@/mocks/kpis'
import { decisionItems } from '@/mocks/insights'
import { topics } from '@/mocks/topics'
import { departments, tenureBuckets } from '@/mocks/departments'
import { visible } from '@/types/common'
import type { Locale } from '@/types/common'

const { t, locale } = useI18n()

const selectedQuarter = ref('2026-q3')
const quarterOptions = [
  { value: '2026-q1', label: 'Q1 2026' },
  { value: '2026-q2', label: 'Q2 2026' },
  { value: '2026-q3', label: 'Q3 2026' },
]

const radarAxes = computed(() =>
  executiveHealth.radar.map((r) => {
    const topic = topics.find((t2) => t2.id === r.topicId)
    return {
      label: topic ? topic.label[locale.value as Locale] : r.topicId,
      thisMonth: r.thisMonth,
      lastMonth: r.lastMonth,
    }
  }),
)

const departmentBarData = computed(() =>
  executiveHealth.departmentComparison.map((d) => {
    const dept = departments.find((dep) => dep.id === d.departmentId)
    return {
      label: dept ? dept.name[locale.value as Locale] : d.departmentId,
      value: d.score,
    }
  }),
)

const tenureBarData = computed(() =>
  executiveHealth.tenureComparison.map((t2) => {
    const bucket = tenureBuckets.find((b) => b.bucket === t2.bucket)
    return {
      label: bucket ? bucket.label[locale.value as Locale] : t2.bucket,
      value: visible(t2.score),
    }
  }),
)
</script>

<template>
  <ExecutiveLayout :breadcrumb="t('executive.orgHealth')">
    <div class="toolbar">
      <DropdownSelect v-model="selectedQuarter" :options="quarterOptions" />
      <div class="actions">
        <button type="button" class="btn">{{ t('common.export') }}</button>
        <button type="button" class="btn">{{ t('common.sendEmail') }}</button>
      </div>
    </div>

    <PrivacyBanner variant="executive-rule" />

    <section class="panel health-card">
      <h2>{{ t('executive.orgHealth') }}</h2>
      <div class="health-body">
        <span class="score">{{ executiveHealth.score }}/100</span>
        <SentimentBar :sentiment="executiveHealth.sentiment" />
      </div>
    </section>

    <section class="panel">
      <h2>{{ t('executive.radarTitle') }}</h2>
      <div class="radar-wrap">
        <RadarChart :axes="radarAxes" />
        <div class="legend">
          <span class="legend-item"><span class="swatch swatch-this" />{{ t('executive.thisMonth') }}</span>
          <span class="legend-item"><span class="swatch swatch-last" />{{ t('executive.lastMonth') }}</span>
        </div>
      </div>
    </section>

    <div class="two-col">
      <section class="panel">
        <h2>{{ t('executive.departmentScores') }}</h2>
        <HorizontalBarChart :data="departmentBarData" :show-values="false" />
      </section>
      <section class="panel">
        <h2>{{ t('executive.tenureScores') }}</h2>
        <HorizontalBarChart :data="tenureBarData" :show-values="true" :max="5" />
      </section>
    </div>

    <DecisionItemsList :items="decisionItems" />
  </ExecutiveLayout>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

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

.health-body {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.score {
  font-size: var(--font-size-xxl);
  font-weight: 700;
}

.radar-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
}

.legend {
  display: flex;
  gap: var(--space-4);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.swatch {
  width: 14px;
  height: 2px;
  display: inline-block;
}

.swatch-this {
  background: var(--color-primary);
}

.swatch-last {
  border-top: 2px dashed var(--color-executive);
}

.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .two-col {
    grid-template-columns: 1fr;
  }
}
</style>
