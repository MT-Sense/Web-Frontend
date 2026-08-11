<script setup lang="ts">
import { useI18n } from 'vue-i18n'

export interface NavItem {
  label: string
  to: string
  icon: string
}

const props = defineProps<{
  items: NavItem[]
  variant: 'full' | 'icon-only'
}>()

const { t } = useI18n()
</script>

<template>
  <nav class="sidebar" :class="props.variant">
    <router-link
      v-for="item in props.items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      active-class="active"
    >
      <span class="icon" aria-hidden="true">{{ item.icon }}</span>
      <span v-if="props.variant === 'full'" class="label">{{ item.label }}</span>
      <span v-else class="visually-hidden">{{ item.label }}</span>
    </router-link>
    <span v-if="props.variant === 'full'" class="visually-hidden">{{ t('nav.dashboard') }}</span>
  </nav>
</template>

<style scoped>
.sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-4) var(--space-3);
  background: var(--color-surface);
  border-right: 1px solid var(--color-border);
  height: 100%;
}

.sidebar.full {
  width: var(--sidebar-width);
}

.sidebar.icon-only {
  width: var(--sidebar-width-collapsed);
  align-items: center;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.nav-item:hover {
  background: var(--color-bg);
}

.nav-item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.icon {
  font-size: var(--font-size-lg);
  line-height: 1;
}
</style>
