<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { UrgentIssue } from '@/types/insight'

defineProps<{ issues: UrgentIssue[] }>()
const { locale, t } = useI18n()
</script>

<template>
  <section class="urgent-issues">
    <h2>{{ t('insight.urgentIssues') }}</h2>
    <ul>
      <li v-for="issue in issues" :key="issue.id">
        <span class="mark">!</span>
        <span class="label">{{ issue.label[locale as Locale] }}</span>
        <span class="dash">—</span>
        <span class="dept">{{ issue.departmentName[locale as Locale] }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.urgent-issues {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-md);
}

ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-negative-bg);
}

.mark {
  color: var(--color-negative);
  font-weight: 700;
}

.label {
  font-weight: 600;
}

.dash,
.dept {
  color: var(--color-text-muted);
}
</style>
