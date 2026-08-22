<script setup lang="ts">
import { Button } from '@/components/ui/button'
</script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <p>The page you were looking for doesn't exist.</p>
    <Button as-child variant="secondary">
      <router-link to="/">Home</router-link>
    </Button>
  </div>
</template>

<style scoped>
.not-found {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-3);
  padding: var(--space-5);
  text-align: center;
}

h1 {
  margin: 0;
  font-size: 64px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--color-primary);
}

p {
  margin: 0 0 var(--space-2);
  color: var(--color-text-muted);
}
</style>
