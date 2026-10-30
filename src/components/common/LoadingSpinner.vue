<script setup lang="ts">
import { LoaderCircle } from '@lucide/vue'
import { useI18n } from 'vue-i18n'

withDefaults(defineProps<{
  label?: string
  inline?: boolean
  size?: 'sm' | 'lg'
}>(), { inline: false, size: 'sm' })

const { t } = useI18n()
</script>

<template>
  <div
    class="loading-spinner"
    :class="{ 'is-inline': inline, 'is-large': size === 'lg' }"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <LoaderCircle class="spinner-icon" :size="size === 'lg' ? 48 : 20" aria-hidden="true" />
    <span>{{ label ?? t('common.loading') }}</span>
  </div>
</template>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-6);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.is-large {
  flex-direction: column;
  gap: var(--space-4);
  min-height: calc(var(--space-7) * 4);
  padding: var(--space-7);
  font-size: var(--font-size-lg);
}

.is-inline {
  display: inline-flex;
  flex-direction: row;
  min-height: 0;
  padding: 0;
}

.spinner-icon {
  flex-shrink: 0;
  color: var(--color-primary);
  animation: loading-spin 0.8s linear infinite;
}

@keyframes loading-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner-icon {
    animation: none;
  }
}
</style>
