<script setup lang="ts">
import RoleSwitcherDev from '@/components/layout/RoleSwitcherDev.vue'
</script>

<template>
  <router-view />
  <RoleSwitcherDev v-if="$router.currentRoute.value.path !== '/login'" />
</template>
