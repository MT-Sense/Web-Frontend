<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Sparkles } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { generateTopicSummary } from '@/api/dashboard'
import { ApiError } from '@/api/client'
import type { TopicDrilldown, TopicSummary } from '@/types/topic'
import type { LocalizedText, Locale } from '@/types/common'

const props = defineProps<{ source: TopicDrilldown }>()
const { t, locale } = useI18n()
const summary = ref<TopicSummary | null>(null)
const loading = ref(false)
const errorKey = ref('')
let requestId = 0
watch(
  () => props.source,
  () => {
    requestId++
    summary.value = null
    loading.value = false
    errorKey.value = ''
  },
  { flush: 'sync' },
)
onBeforeUnmount(() => {
  requestId++
})
const label = (text: LocalizedText) => text[locale.value as Locale] || text.th
const failureKeys: Record<string, string> = {
  summary_provider_request: 'drilldown.aiSummary.providerRequest',
  summary_provider_auth: 'drilldown.aiSummary.providerAuth',
  summary_model_unavailable: 'drilldown.aiSummary.modelUnavailable',
  summary_provider_quota: 'drilldown.aiSummary.providerQuota',
  summary_timeout: 'drilldown.aiSummary.timeout',
  summary_invalid_response: 'drilldown.aiSummary.invalidResponse',
  summary_invalid_evidence: 'drilldown.aiSummary.invalidEvidence',
}

async function generate() {
  if (loading.value) return
  const current = ++requestId
  const source = props.source
  loading.value = true
  summary.value = null
  errorKey.value = ''
  try {
    const result = await generateTopicSummary(source.topicId, source.periodId, source.departmentId)
    if (current !== requestId) return
    // Reject a mismatched response rather than displaying another scope's summary.
    if (
      result.topicId !== source.topicId ||
      result.periodId !== source.periodId ||
      (result.departmentId || '') !== (source.departmentId || '')
    )
      throw new Error('scope mismatch')
    summary.value = result
  } catch (error) {
    if (current !== requestId) return
    const code =
      error instanceof ApiError && typeof error.body.code === 'string' ? error.body.code : ''
    errorKey.value =
      failureKeys[code] ??
      (error instanceof ApiError && error.status === 422
        ? 'drilldown.aiSummary.insufficient'
        : error instanceof ApiError && error.status === 429
          ? 'drilldown.aiSummary.rateLimited'
          : 'drilldown.aiSummary.failed')
  } finally {
    if (current === requestId) loading.value = false
  }
}
</script>

<template>
  <section class="panel topic-summary" :aria-busy="loading">
    <header class="summary-header">
      <h2 class="panel-title">
        {{ t('drilldown.aiSummary.title') }}
        <InfoTooltip
          :label="t('drilldown.aiSummary.title')"
          :text="t('drilldown.aiSummary.help')"
        />
      </h2>
      <Button :disabled="loading" @click="generate">
        <Sparkles :size="16" aria-hidden="true" />
        {{ t(summary ? 'drilldown.aiSummary.regenerate' : 'drilldown.aiSummary.generate') }}
      </Button>
    </header>
    <p class="hint">{{ t('drilldown.aiSummary.consent') }}</p>
    <LoadingSpinner v-if="loading" :label="t('drilldown.aiSummary.loading')" />
    <Alert v-else-if="errorKey" variant="destructive">
      <AlertDescription>{{ t(errorKey) }}</AlertDescription>
    </Alert>
    <template v-else-if="summary">
      <p class="summary-meta">
        {{ t('drilldown.aiSummary.coverage', { count: summary.sampledComments }) }}
      </p>
      <div v-if="summary.themes.length" class="theme-grid">
        <article v-for="(theme, index) in summary.themes" :key="index" class="theme">
          <h3>{{ label(theme.title) }}</h3>
          <p>{{ label(theme.summary) }}</p>
          <span class="support-count">{{
            t('drilldown.aiSummary.support', { count: theme.supportingCount })
          }}</span>
          <details>
            <summary>{{ t('drilldown.aiSummary.evidence') }}</summary>
            <blockquote v-for="(excerpt, i) in theme.excerpts" :key="i">{{ excerpt }}</blockquote>
          </details>
        </article>
      </div>
      <p v-else class="hint">{{ t('drilldown.aiSummary.empty') }}</p>
      <p class="hint">{{ t('drilldown.aiSummary.review') }}</p>
    </template>
    <p v-else class="hint">{{ t('drilldown.aiSummary.idle') }}</p>
  </section>
</template>

<style scoped>
.topic-summary {
  display: grid;
  gap: var(--space-3);
}
.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}
.panel-title {
  margin: 0;
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
p {
  margin: 0;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
.hint,
.summary-meta {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 26ch), 1fr));
  gap: var(--space-3);
}
.theme {
  display: grid;
  align-content: start;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  min-width: 0;
}
h3 {
  margin: 0;
  font-size: var(--font-size-md);
}
.support-count {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}
summary {
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 600;
}
blockquote {
  margin: var(--space-3) 0 0;
  padding-inline-start: var(--space-3);
  border-inline-start: var(--space-1) solid var(--color-accent-200);
  font-size: var(--font-size-sm);
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
@media (max-width: 640px) {
  .summary-header {
    align-items: stretch;
  }
  .summary-header > button {
    width: 100%;
  }
}
</style>
