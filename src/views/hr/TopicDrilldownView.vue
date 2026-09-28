<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Download, Plus } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import SingleLineChart from '@/components/charts/SingleLineChart.vue'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as dashboardApi from '@/api/dashboard'
import * as feedApi from '@/api/feed'
import { ApiError } from '@/api/client'
import type { Locale } from '@/types/common'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()
const route = useRoute()
const selectedDepartment = computed(() => typeof route.query.department === 'string' ? route.query.department : undefined)
const selectedPeriod = computed(() => typeof route.query.period === 'string' ? route.query.period : undefined)
const hiddenForPrivacy = ref(false)

async function loadDrilldown() {
  hiddenForPrivacy.value = false
  try {
    return await dashboardApi.topicDrilldown(props.id, selectedPeriod.value, selectedDepartment.value)
  } catch (err) {
    if (selectedDepartment.value && err instanceof ApiError && err.status === 404) {
      hiddenForPrivacy.value = true
      return null
    }
    throw err
  }
}

const { data: topicList } = useAsyncData(() => dashboardApi.topics())
const {
  data: drilldown,
  loading,
  error,
  reload,
} = useAsyncData(loadDrilldown)
watch(() => [props.id, selectedPeriod.value, selectedDepartment.value], reload)

const { data: actionItems, reload: reloadActionItems } = useAsyncData(() => feedApi.actionItems())

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

const relatedActionItems = computed(
  () => (actionItems.value ?? []).filter((a) => topic.value && a.topic.th === topic.value.label.th),
)

const showAddAction = ref(false)
const newAction = reactive({ assignee: '', targetDate: '' })
const submitting = ref(false)

async function submitAction() {
  if (!topic.value || submitting.value) return
  submitting.value = true
  try {
    await feedApi.createActionItem({
      topic: topic.value.label,
      topicId: topic.value.id,
      assignee: newAction.assignee || 'TBD',
      targetDate: newAction.targetDate || '',
    })
    newAction.assignee = ''
    newAction.targetDate = ''
    showAddAction.value = false
    await reloadActionItems()
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <HrLayout :breadcrumb="breadcrumb">
    <p v-if="loading">{{ t('common.loading') }}</p>
    <Alert v-else-if="hiddenForPrivacy">
      <AlertDescription>{{ t('privacy.suppressed') }}</AlertDescription>
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
          <Button variant="secondary" size="sm">
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

      <section v-if="!drilldown.departmentId" class="panel">
        <div class="panel-header">
          <h2>Action Items</h2>
          <Button size="sm" @click="showAddAction = true">
            <Plus :size="15" aria-hidden="true" />
            {{ t('drilldown.addAction') }}
          </Button>
        </div>
        <div v-if="showAddAction" class="add-action-form">
          <Input v-model="newAction.assignee" placeholder="Assignee" class="max-w-48" />
          <Input v-model="newAction.targetDate" type="date" class="max-w-44" />
          <Button :disabled="submitting" @click="submitAction">{{ t('common.save') }}</Button>
          <Button variant="secondary" @click="showAddAction = false">{{ t('common.cancel') }}</Button>
        </div>
        <ul class="action-list">
          <li v-for="item in relatedActionItems" :key="item.id">
            {{ item.assignee }} — {{ item.targetDate }} ({{ item.status }})
          </li>
        </ul>
      </section>
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

.add-action-form {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.action-list {
  margin: 0;
  padding-left: var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
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
