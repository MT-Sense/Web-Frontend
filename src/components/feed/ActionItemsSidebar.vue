<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { CircleCheck, LoaderCircle } from '@lucide/vue'
import type { Locale } from '@/types/common'
import type { ActionItem } from '@/types/actionItem'

defineProps<{ items: ActionItem[] }>()
const { locale, t } = useI18n()
</script>

<template>
  <section class="action-items panel">
    <h2>{{ t('feed.actionsDone') }}</h2>
    <ul>
      <li v-for="item in items" :key="item.id">
        <CircleCheck
          v-if="item.status === 'done'"
          :size="16"
          class="icon done"
          aria-hidden="true"
        />
        <LoaderCircle v-else :size="16" class="icon in_progress" aria-hidden="true" />
        <span>{{ item.topic[locale as Locale] }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.action-items {
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
  flex: none;
}

.icon.done {
  color: var(--color-positive);
}

.icon.in_progress {
  color: var(--color-neutral);
}
</style>
