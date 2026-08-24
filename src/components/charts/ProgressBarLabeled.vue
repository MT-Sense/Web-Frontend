<script setup lang="ts">
withDefaults(defineProps<{ label: string; percentage: number; color?: string }>(), {
  color: 'var(--color-primary)',
})
</script>

<template>
  <div class="progress-labeled">
    <div class="top">
      <span class="label">{{ label }}</span>
      <span class="pct">{{ percentage }}%</span>
    </div>
    <div class="track">
      <div class="fill" :style="{ width: percentage + '%', background: color }" />
    </div>
  </div>
</template>

<style scoped>
.progress-labeled {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.top {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-sm);
}

.label {
  font-weight: 600;
}

.pct {
  color: var(--color-text-muted);
}

.track {
  height: 8px;
  border-radius: 999px;
  background: var(--color-bg);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  transform-origin: left center;
  animation: grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .fill {
    animation: none;
  }
}
</style>
