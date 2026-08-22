<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { WordCloudTerm } from '@/types/insight'

const props = defineProps<{ terms: WordCloudTerm[] }>()
const emit = defineEmits<{ termClick: [topicId: string] }>()

const { locale } = useI18n()

const maxFreq = computed(() => Math.max(...props.terms.map((t) => t.frequency)))

function fontSize(freq: number) {
  const min = 13
  const max = 34
  const ratio = freq / maxFreq.value
  return `${min + ratio * (max - min)}px`
}
</script>

<template>
  <div class="word-cloud">
    <button
      v-for="term in props.terms"
      :key="term.topicId + term.term.th"
      type="button"
      class="term"
      :style="{ fontSize: fontSize(term.frequency) }"
      @click="emit('termClick', term.topicId)"
    >
      {{ term.term[locale as Locale] }}
    </button>
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

.term {
  border: none;
  background: none;
  color: var(--color-accent-600);
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.term:hover {
  color: var(--color-accent-800);
  background: var(--color-accent-100);
  transform: translateY(-1px);
}

.term:active {
  transform: scale(0.96);
}
</style>
