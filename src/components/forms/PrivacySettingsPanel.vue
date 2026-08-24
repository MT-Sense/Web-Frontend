<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Lock } from '@lucide/vue'

const { t } = useI18n()
</script>

<template>
  <!-- Deliberately no v-if/collapse control here — this panel cannot be dismissed. -->
  <div class="privacy-settings">
    <Lock :size="16" class="icon" aria-hidden="true" />
    <span>{{ t('privacy.formBuilder') }}</span>
  </div>
</template>

<style scoped>
.privacy-settings {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-accent-100);
  box-shadow: inset 0 0 0 1px var(--color-accent-200);
  color: var(--color-accent-700);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1.45;
}

.icon {
  flex: none;
}
</style>
