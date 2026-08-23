<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Mail } from '@lucide/vue'
import ExecutiveLayout from '@/layouts/ExecutiveLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import DecisionItemsList from '@/components/dashboard/DecisionItemsList.vue'
import { visible } from '@/types/common'
import type { Locale } from '@/types/common'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'

const { t, locale } = useI18n()

const { data: topicList } = useAsyncData(() => dashboardApi.topics())
const { data: departmentList } = useAsyncData(() => dashboardApi.departments())
const { data: executiveHealth, loading, error, reload } = useAsyncData(() => dashboardApi.executiveSummary())

const radarAxes = computed(() =>
  (executiveHealth.value?.radar ?? []).map((r) => {
    const topic = topicList.value?.find((t2) => t2.id === r.topicId)
    return {
      label: topic ? topic.label[locale.value as Locale] : r.topicId,
      thisMonth: r.thisMonth,
      lastMonth: r.lastMonth,
    }
  }),
)

const departmentBarData = computed(() =>
  (executiveHealth.value?.departmentComparison ?? []).map((d) => {
    const dept = departmentList.value?.find((dep) => dep.id === d.departmentId)
    return {
      label: dept ? dept.name : d.departmentId,
      value: d.score,
    }
  }),
)

const positionBarData = computed(() =>
  (executiveHealth.value?.positionComparison ?? []).map((p) => ({
    label: p.name,
    value: visible(p.score),
  })),
)
</script>

<template>
  <ExecutiveLayout :breadcrumb="t('executive.orgHealth')">
    <div class="toolbar">
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

    <PrivacyBanner variant="executive-rule" />

    <p v-if="loading && !executiveHealth">{{ t('common.loading') }}</p>
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>
        {{ t('common.loadError') }}
        <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
      </AlertDescription>
    </Alert>

    <template v-else-if="executiveHealth">
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
          <h2>{{ t('executive.positionScores') }}</h2>
          <HorizontalBarChart :data="positionBarData" :show-values="true" :max="5" />
        </section>
      </div>

      <DecisionItemsList :items="executiveHealth.decisionItems" />
    </template>
  </ExecutiveLayout>
</template>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.actions {
  display: flex;
  gap: var(--space-2);
}

.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

.health-body {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  flex-wrap: wrap;
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
  border-top: 2px dashed var(--color-text-subtle);
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

@media (max-width: 560px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-3);
  }

  .actions {
    flex-wrap: wrap;
  }

  .health-body {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }
}
</style>
