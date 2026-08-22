<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Lock } from '@lucide/vue'

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
    <Lock :size="16" class="icon" aria-hidden="true" />
    <span>{{ t(textKey) }}</span>
  </div>
</template>

<style scoped>
.privacy-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: var(--color-accent-100);
  box-shadow: inset 0 0 0 1px var(--color-accent-200);
  color: var(--color-accent-700);
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1.45;
  border-radius: var(--radius-md);
}

.icon {
  flex: none;
}
</style>
