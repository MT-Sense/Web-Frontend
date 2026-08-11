<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import { publishedSummaries } from '@/mocks/feed'

const { locale, t } = useI18n()
</script>

<template>
  <section class="published-summaries">
    <h2>{{ t('feed.publishedSummaries') }}</h2>
    <article v-for="summary in publishedSummaries" :key="summary.id" class="summary-item">
      <h3>{{ summary.title[locale as Locale] }}</h3>
      <p>{{ summary.body[locale as Locale] }}</p>
      <span class="date">{{ summary.publishedAt }}</span>
    </article>
  </section>
</template>

<style scoped>
.published-summaries {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
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

.date {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}
</style>
