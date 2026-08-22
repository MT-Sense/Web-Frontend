<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { TriangleAlert } from '@lucide/vue'

const { t } = useI18n()
</script>

<template>
  <p class="warning">
    <TriangleAlert :size="14" aria-hidden="true" />
    {{ t('formBuilder.identifyingWarning') }}
  </p>
</template>

<style scoped>
.warning {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-sm);
  background: var(--color-negative-bg);
  color: var(--color-negative);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
</style>
