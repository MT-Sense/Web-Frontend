<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  variant: 'filters-active' | 'executive-rule' | 'form-builder' | 'survey-step'
}>()

const { t } = useI18n()

const textKey = computed(() => {
  switch (props.variant) {
    case 'filters-active':
      return 'privacy.filtersActive'
    case 'executive-rule':
      return 'privacy.executiveRule'
    case 'form-builder':
      return 'privacy.formBuilder'
    case 'survey-step':
      return 'privacy.surveyStep'
  }
  return 'privacy.filtersActive'
})
</script>

<template>
  <div class="privacy-banner" :class="props.variant" role="note">
    <span class="icon" aria-hidden="true">🔒</span>
    <span>{{ t(textKey) }}</span>
  </div>
</template>

<style scoped>
.privacy-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-radius: var(--radius-sm);
}

.icon {
  font-size: var(--font-size-md);
}
</style>
