<script setup lang="ts">
// Presentation only: callers own loading, errors and the accessible status message.
withDefaults(
  defineProps<{
    variant?: 'text' | 'value' | 'control'
  }>(),
  { variant: 'text' },
)
</script>

<template>
  <span class="loading-skeleton" :class="`skeleton-${variant}`" aria-hidden="true" />
</template>

<style scoped>
.loading-skeleton {
  display: block;
  width: 100%;
  height: 2em;
  border-radius: var(--radius-sm);
  background: var(--color-border);
  animation: skeleton-pulse 1.6s ease-in-out infinite;
}
.skeleton-value {
  display: inline-block;
  width: 2.5ch;
  vertical-align: middle;
}
.skeleton-control {
  height: calc(1.5em + var(--space-2) * 2 + 2px);
  border-radius: var(--radius-md);
}
@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .loading-skeleton {
    animation: none;
  }
}
</style>
