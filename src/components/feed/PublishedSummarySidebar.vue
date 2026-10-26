<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { PublishedSummary } from '@/api/feed'

defineProps<{ summaries: PublishedSummary[] }>()
const { locale, t } = useI18n()

/** English is optional when HR writes a summary, so fall back to Thai. */
function text(value: PublishedSummary['title']) {
  return value[locale.value as Locale] || value.th
}
</script>

<template>
  <section class="published-summaries panel">
    <h2>{{ t('feed.publishedSummaries') }}</h2>
    <article v-for="summary in summaries" :key="summary.id" class="summary-item">
      <h3>{{ text(summary.title) }}</h3>
      <p>{{ text(summary.body) }}</p>
      <span class="date">{{ summary.publishedAt }}</span>
    </article>
    <p v-if="summaries.length === 0" class="empty">{{ t('feed.noSummaries') }}</p>
  </section>
</template>

<style scoped>
.published-summaries {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

h2 {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.summary-item h3 {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-sm);
}

.summary-item p {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.summary-item p {
  white-space: pre-line;
}

.empty {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.date {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}
</style>
