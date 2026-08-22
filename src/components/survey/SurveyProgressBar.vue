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
  border-radius: 999px;
  transition: width 350ms cubic-bezier(0.22, 1, 0.36, 1);
}
</style>
