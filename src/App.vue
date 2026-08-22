<script setup lang="ts">
import RoleSwitcherDev from '@/components/layout/RoleSwitcherDev.vue'
</script>

<template>
  <router-view v-slot="{ Component }">
    <transition name="page" mode="out-in">
      <component :is="Component" />
    </transition>
  </router-view>
  <RoleSwitcherDev v-if="$router.currentRoute.value.path !== '/login'" />
</template>
