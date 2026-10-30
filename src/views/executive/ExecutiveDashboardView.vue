<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, Mail } from '@lucide/vue'
import ExecutiveLayout from '@/layouts/ExecutiveLayout.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import PrivacyBanner from '@/components/layout/PrivacyBanner.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import RadarChart from '@/components/charts/RadarChart.vue'
import HorizontalBarChart from '@/components/charts/HorizontalBarChart.vue'
import DecisionItemsList from '@/components/dashboard/DecisionItemsList.vue'
import KnowledgeQAPanel from '@/components/dashboard/KnowledgeQAPanel.vue'
import SendSummaryDialog from '@/components/dashboard/SendSummaryDialog.vue'
import { visible } from '@/types/common'
import type { Locale } from '@/types/common'
import { useAsyncData } from '@/composables/useAsyncData'
import { downloadCsv, toCsv, type CsvSection } from '@/utils/csv'
import * as dashboardApi from '@/api/dashboard'

const { t, locale } = useI18n()
const emailDialogOpen = ref(false)

const { data: topicList } = useAsyncData(() => dashboardApi.topics())
const { data: departmentList } = useAsyncData(() => dashboardApi.departments())
const {
  data: executiveHealth,
  loading,
  error,
  reload,
} = useAsyncData(() => dashboardApi.executiveSummary())

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

/** Exports the aggregates on this page (latest round). Executives only ever receive
 * suppression-gated aggregates, so the file contains nothing more than the screen. */
function exportCsv() {
  const health = executiveHealth.value
  if (!health) return
  const hidden = t('export.hidden')
  const sections: CsvSection[] = [
    {
      title: t('export.executiveTitle'),
      headers: [t('export.metric'), t('export.value')],
      rows: [
        [t('executive.orgHealth'), health.score],
        [
          t('export.sentiment'),
          health.sentiment === null
            ? hidden
            : `${health.sentiment.positive}% / ${health.sentiment.neutral}% / ${health.sentiment.negative}%`,
        ],
      ],
    },
    {
      title: t('export.radarTitle'),
      headers: [t('drilldown.topic'), t('export.thisRound'), t('export.lastRound')],
      rows: radarAxes.value.map((axis) => [axis.label, axis.thisMonth, axis.lastMonth]),
    },
    {
      title: t('export.departmentsTitle'),
      headers: [t('departmentScores.department'), t('departmentScores.average')],
      rows: departmentBarData.value.map((row) => [
        row.label,
        row.value.suppressed ? hidden : row.value.data,
      ]),
    },
    {
      title: t('export.positionsTitle'),
      headers: [t('export.position'), t('departmentScores.average')],
      rows: health.positionComparison.map((p) => [p.name, p.score]),
    },
  ]
  downloadCsv(`mt-sense-executive-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(sections))
}

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
        <Button variant="secondary" :disabled="!executiveHealth" @click="exportCsv">
          <Download :size="16" aria-hidden="true" />
          {{ t('common.export') }}
        </Button>
        <Button variant="secondary" @click="emailDialogOpen = true">
          <Mail :size="16" aria-hidden="true" />
          {{ t('common.sendEmail') }}
        </Button>
      </div>
    </div>

    <SendSummaryDialog v-model:open="emailDialogOpen" />

    <PrivacyBanner variant="executive-rule" />

    <LoadingSpinner v-if="loading && !executiveHealth" size="lg" />
    <Alert v-else-if="error" variant="destructive">
      <AlertDescription>
        {{ t('common.loadError') }}
        <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
      </AlertDescription>
    </Alert>

    <template v-else-if="executiveHealth">
      <KnowledgeQAPanel />

      <section class="panel health-card">
        <h2>
          {{ t('executive.orgHealth') }}
          <InfoTooltip :label="t('executive.orgHealth')" :text="t('dashboardHelp.health')" />
        </h2>
        <div class="health-body">
          <span v-if="executiveHealth.score === null">{{ t('metrics.insufficient') }}</span>
          <span v-else class="score">{{ executiveHealth.score }}/100</span>
          <SentimentBar :sentiment="executiveHealth.sentiment" />
        </div>
      </section>

      <section class="panel">
        <h2>
          {{ t('executive.radarTitle') }}
          <InfoTooltip :label="t('executive.radarTitle')" :text="t('dashboardHelp.radar')" />
        </h2>
        <div class="radar-wrap">
          <RadarChart :axes="radarAxes" />
          <div class="legend">
            <span class="legend-item"
              ><span class="swatch swatch-this" />{{ t('executive.thisMonth') }}</span
            >
            <span class="legend-item"
              ><span class="swatch swatch-last" />{{ t('executive.lastMonth') }}</span
            >
          </div>
        </div>
      </section>

      <div class="two-col">
        <section class="panel">
          <h2>
            {{ t('executive.departmentScores') }}
            <InfoTooltip
              :label="t('executive.departmentScores')"
              :text="t('dashboardHelp.comparison')"
            />
          </h2>
          <HorizontalBarChart :data="departmentBarData" :show-values="false" />
        </section>
        <section class="panel">
          <h2>
            {{ t('executive.positionScores') }}
            <InfoTooltip
              :label="t('executive.positionScores')"
              :text="t('dashboardHelp.comparison')"
            />
          </h2>
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
