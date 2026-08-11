<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <div class="suppressed">
    <span class="icon" aria-hidden="true">🔒</span>
    <span>{{ t('privacy.suppressed') }}</span>
  </div>
</template>

<style scoped>
.suppressed {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  font-style: italic;
  height: 100%;
  padding: var(--space-2);
}
</style>
