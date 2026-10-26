<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleCheck, LoaderCircle } from '@lucide/vue'
import type { Locale } from '@/types/common'
import type { ActionItem } from '@/types/actionItem'

const props = defineProps<{ items: ActionItem[] }>()
const { locale, t } = useI18n()

const inProgress = computed(() => props.items.filter((item) => item.status !== 'done'))
const done = computed(() => props.items.filter((item) => item.status === 'done'))

function label(item: ActionItem) {
  return item.topic[locale.value as Locale] || item.topic.th
}
</script>

<template>
  <section class="action-items panel">
    <h2>{{ t('feed.actionsTitle') }}</h2>
    <p v-if="items.length === 0" class="empty">{{ t('feed.noActions') }}</p>

    <template v-if="inProgress.length">
      <h3>{{ t('feed.actionsInProgress') }}</h3>
      <ul>
        <li v-for="item in inProgress" :key="item.id">
          <LoaderCircle :size="16" class="icon in_progress" aria-hidden="true" />
          <span>
            {{ label(item) }}
            <span v-if="item.targetDate" class="meta">· {{ t('feed.actionTarget', { date: item.targetDate }) }}</span>
          </span>
        </li>
      </ul>
    </template>

    <template v-if="done.length">
      <h3>{{ t('feed.actionsDone') }}</h3>
      <ul>
        <li v-for="item in done" :key="item.id">
          <CircleCheck :size="16" class="icon done" aria-hidden="true" />
          <span>
            {{ label(item) }}
            <span v-if="item.doneAt" class="meta">· {{ item.doneAt }}</span>
          </span>
        </li>
      </ul>
    </template>
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

h3 {
  margin: 0;
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
}

.meta,
.empty {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.empty {
  margin: 0;
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
