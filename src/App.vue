<script setup lang="ts">
import { ToastHost } from '@/components/ui/toast'
</script>

<template>
  <router-view v-slot="{ Component, route }">
    <component :is="Component" :key="route.fullPath" />
  </router-view>
  <ToastHost />
</template>
