<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { FileEdit, MessageSquare, Settings } from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SidebarNav, { type NavItem } from '@/components/layout/SidebarNav.vue'

withDefaults(defineProps<{ breadcrumb?: string; hideSidebar?: boolean }>(), {
  breadcrumb: '',
  hideSidebar: false,
})

const { t } = useI18n()

const items = computed<NavItem[]>(() => [
  { label: t('nav.voices'), to: '/voices', icon: MessageSquare },
  { label: t('nav.mySurveys'), to: '/survey/demo-1', icon: FileEdit },
  { label: t('nav.settings'), to: '/settings', icon: Settings },
])
</script>

<template>
  <div class="layout">
    <SidebarNav v-if="!hideSidebar" :items="items" variant="full" />
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
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .content {
    padding: var(--space-4);
  }
}
</style>
