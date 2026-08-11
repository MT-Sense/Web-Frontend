<script setup lang="ts">
defineProps<{ ratio: number }>()
</script>

<template>
  <div class="progress">
    <div class="fill" :style="{ width: Math.round(ratio * 100) + '%' }" />
  </div>
</template>

<style scoped>
.progress {
  height: 6px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
}

.fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.2s ease;
}
</style>
