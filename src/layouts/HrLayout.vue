<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AppHeader from '@/components/layout/AppHeader.vue'
import SidebarNav, { type NavItem } from '@/components/layout/SidebarNav.vue'

withDefaults(defineProps<{ breadcrumb?: string }>(), { breadcrumb: '' })

const { t } = useI18n()

const items = computed<NavItem[]>(() => [
  { label: t('nav.dashboard'), to: '/dashboard', icon: '📊' },
  { label: t('nav.topics'), to: '/dashboard/topics/work', icon: '🗂️' },
  { label: t('nav.feed'), to: '/voices', icon: '💬' },
  { label: t('nav.forms'), to: '/forms/builder/demo-1', icon: '🛠️' },
  { label: t('nav.reports'), to: '/dashboard', icon: '📤' },
  { label: t('nav.settings'), to: '/settings', icon: '⚙️' },
])
</script>

<template>
  <div class="layout">
    <SidebarNav :items="items" variant="full" />
    <div class="main">
      <AppHeader :breadcrumb="breadcrumb" />
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content {
  flex: 1;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
</style>
