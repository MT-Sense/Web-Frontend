<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <!-- Deliberately no v-if/collapse control here — this panel cannot be dismissed. -->
  <div class="privacy-settings">
    <span class="icon">🔒</span>
    <span>{{ t('privacy.formBuilder') }}</span>
  </div>
</template>

<style scoped>
.privacy-settings {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
}
</style>
