<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HrLayout from '@/layouts/HrLayout.vue'
import SentimentBar from '@/components/kpi/SentimentBar.vue'
import SingleLineChart from '@/components/charts/SingleLineChart.vue'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'
import { topicDrilldowns } from '@/mocks/topicDrilldown'
import { topics } from '@/mocks/topics'
import { actionItems } from '@/mocks/actionItems'
import type { Locale } from '@/types/common'

const props = defineProps<{ id: string }>()
const { t, locale } = useI18n()

const drilldown = computed(() => topicDrilldowns[props.id])
const topic = computed(() => topics.find((t2) => t2.id === props.id))

const trendPoints = computed(
  () => drilldown.value?.trend.map((p) => ({ label: p.month.slice(5), value: p.score })) ?? [],
)

const showAddAction = ref(false)
const newAction = reactive({ assignee: '', targetDate: '' })

function submitAction() {
  if (!drilldown.value) return
  actionItems.push({
    id: `a-${Date.now()}`,
    topic: topic.value?.label ?? { th: props.id, en: props.id },
    assignee: newAction.assignee || 'TBD',
    status: 'in_progress',
    createdBy: 'HR',
    level: 'full',
    targetDate: newAction.targetDate || '',
  })
  newAction.assignee = ''
  newAction.targetDate = ''
  showAddAction.value = false
}
</script>

<template>
  <HrLayout :breadcrumb="topic ? topic.label[locale as Locale] : ''">
    <div v-if="drilldown" class="drilldown">
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
          <button type="button" class="btn">{{ t('common.export') }}</button>
        </div>
        <SingleLineChart :points="trendPoints" :max="5" />
      </section>

      <div class="two-col">
        <section class="panel">
          <h2>{{ t('drilldown.subIssues') }}</h2>
          <div class="sub-issues">
            <ProgressBarLabeled
              v-for="issue in drilldown.subIssues"
              :key="issue.id"
              :label="issue.label[locale as Locale]"
              :percentage="issue.percentage"
            />
          </div>
          <SentimentBar :sentiment="drilldown.sentiment" />
        </section>

        <section class="panel">
          <h2>{{ t('drilldown.sampleQuotes') }}</h2>
          <ul class="quotes">
            <li v-for="(quote, i) in drilldown.sampleQuotes" :key="i">“{{ quote }}”</li>
          </ul>
        </section>
      </div>

      <section class="panel">
        <div class="panel-header">
          <h2>Action Items</h2>
          <button type="button" class="btn primary" @click="showAddAction = true">
            {{ t('drilldown.addAction') }}
          </button>
        </div>
        <div v-if="showAddAction" class="add-action-form">
          <input v-model="newAction.assignee" placeholder="Assignee" />
          <input v-model="newAction.targetDate" type="date" />
          <button type="button" class="btn primary" @click="submitAction">{{ t('common.save') }}</button>
          <button type="button" class="btn" @click="showAddAction = false">{{ t('common.cancel') }}</button>
        </div>
        <ul class="action-list">
          <li v-for="item in actionItems.filter((a) => a.topic.th === topic?.label.th)" :key="item.id">
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

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
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
}

.score-panel {
  display: flex;
  align-items: center;
  gap: var(--space-6);
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

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.add-action-form {
  display: flex;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.add-action-form input {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2);
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
</style>
