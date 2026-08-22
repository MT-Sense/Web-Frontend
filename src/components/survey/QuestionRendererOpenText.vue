<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { SurveyQuestion } from '@/types/survey'

const props = defineProps<{
  question: SurveyQuestion
  modelValue: string
  tags: string[]
  optedIn: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:tags': [tags: string[]]
  'update:optedIn': [value: boolean]
}>()
const { t } = useI18n()

const customTag = ref('')

function toggleTag(tag: string) {
  const next = props.tags.includes(tag) ? props.tags.filter((x) => x !== tag) : [...props.tags, tag]
  emit('update:tags', next)
}

function addCustomTag() {
  const value = customTag.value.trim()
  if (value && !props.tags.includes(value)) {
    emit('update:tags', [...props.tags, value])
  }
  customTag.value = ''
}
</script>

<template>
  <div class="open-text">
    <textarea
      :value="modelValue"
      :placeholder="t('survey.openTextPlaceholder')"
      rows="4"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <div v-if="question.tagSuggestions?.length" class="tags">
      <button
        v-for="tag in question.tagSuggestions"
        :key="tag"
        type="button"
        class="tag"
        :class="{ active: tags.includes(tag) }"
        @click="toggleTag(tag)"
      >
        #{{ tag }}
      </button>
      <input
        v-model="customTag"
        class="tag-input"
        :placeholder="t('survey.addTag')"
        @keyup.enter="addCustomTag"
      />
    </div>
    <label v-if="question.allowPublishOptIn" class="opt-in">
      <input
        type="checkbox"
        :checked="optedIn"
        @change="emit('update:optedIn', ($event.target as HTMLInputElement).checked)"
      />
      <span>{{ t('survey.optInPublish') }}</span>
    </label>
  </div>
</template>

<style scoped>
.open-text {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

textarea {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-3);
  resize: vertical;
  font-family: inherit;
  background: var(--color-surface);
  color: var(--color-text);
  transition: border-color 150ms ease;
}

textarea:hover {
  border-color: var(--color-accent-300);
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.tag {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: 999px;
  padding: 2px var(--space-3);
  font-size: var(--font-size-xs);
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text-muted);
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    color 150ms ease,
    transform 150ms ease;
}

.tag:hover {
  border-color: var(--color-accent-300);
  color: var(--color-text);
}

.tag:active {
  transform: scale(0.94);
}

.tag.active {
  background: var(--color-accent-100);
  border-color: var(--color-primary);
  color: var(--color-accent-700);
}

.tag-input {
  border: 1px dashed var(--color-border);
  border-radius: 999px;
  padding: 2px var(--space-3);
  font-size: var(--font-size-xs);
  width: 120px;
}

.opt-in {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
