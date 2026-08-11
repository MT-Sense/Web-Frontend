<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { DecisionItem } from '@/types/insight'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'

defineProps<{ items: DecisionItem[] }>()
const { locale, t } = useI18n()
</script>

<template>
  <section class="decision-items">
    <h2>{{ t('insight.decisionItems') }}</h2>
    <ol>
      <li v-for="item in items" :key="item.id">
        <ProgressBarLabeled
          :label="`${item.rank}. ${item.label[locale as Locale]}`"
          :percentage="item.severity"
          color="var(--color-executive)"
        />
      </li>
    </ol>
  </section>
</template>

<style scoped>
.decision-items {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-md);
}

ol {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}
</style>
