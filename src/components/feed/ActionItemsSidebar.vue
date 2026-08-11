<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import { actionItems } from '@/mocks/actionItems'

const { locale, t } = useI18n()

function statusIcon(status: string) {
  return status === 'done' ? '✓' : '◔'
}
</script>

<template>
  <section class="action-items">
    <h2>{{ t('feed.actionsDone') }}</h2>
    <ul>
      <li v-for="item in actionItems" :key="item.id">
        <span class="icon" :class="item.status">{{ statusIcon(item.status) }}</span>
        <span>{{ item.topic[locale as Locale] }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.action-items {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
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
}

.icon {
  font-weight: 700;
}

.icon.done {
  color: var(--color-positive);
}

.icon.in_progress {
  color: var(--color-neutral);
}
</style>
