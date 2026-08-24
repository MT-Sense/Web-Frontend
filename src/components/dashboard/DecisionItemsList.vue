<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { DecisionItem } from '@/types/insight'
import ProgressBarLabeled from '@/components/charts/ProgressBarLabeled.vue'

defineProps<{ items: DecisionItem[] }>()
const { locale, t } = useI18n()
</script>

<template>
  <section class="decision-items panel">
    <h2>{{ t('insight.decisionItems') }}</h2>
    <ol>
      <li v-for="item in items" :key="item.id">
        <ProgressBarLabeled
          :label="`${item.rank}. ${item.label[locale as Locale]}`"
          :percentage="item.severity"
          color="var(--color-primary)"
        />
      </li>
    </ol>
  </section>
</template>

<style scoped>
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
