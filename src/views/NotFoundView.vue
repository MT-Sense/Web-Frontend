<script setup lang="ts"></script>

<template>
  <div class="not-found">
    <h1>404</h1>
    <router-link to="/">Home</router-link>
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
}
</style>
