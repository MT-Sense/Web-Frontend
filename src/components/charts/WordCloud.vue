<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { WordCloudTerm } from '@/types/insight'

const props = defineProps<{ terms: WordCloudTerm[]; compact?: boolean }>()

const { locale, t } = useI18n()

const maxFreq = computed(() => Math.max(1, ...props.terms.map((t) => t.frequency)))

function fontSize(freq: number) {
  const min = props.compact ? 12 : 13
  const max = props.compact ? 22 : 34
  const ratio = freq / maxFreq.value
  return `${min + ratio * (max - min)}px`
}
</script>

<template>
  <div class="word-cloud" :class="{ compact: props.compact }">
    <p v-if="props.terms.length === 0" class="empty">{{ t('wordcloud.empty') }}</p>
    <span
      v-for="term in props.terms"
      :key="term.term.th"
      class="term"
      :style="{ fontSize: fontSize(term.frequency) }"
    >
      {{ term.term[locale as Locale] }}
    </span>
  </div>
</template>

<style scoped>
.word-cloud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
}

.word-cloud.compact {
  gap: var(--space-1);
  padding: 0;
  align-content: flex-start;
}

.empty {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.term {
  color: var(--color-accent-600);
  font-weight: 700;
  line-height: 1;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
}
</style>
