<script setup lang="ts">
import type { Component } from 'vue'
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Menu } from '@lucide/vue'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

export interface NavItem {
  label: string
  to: string
  icon: Component
}

const props = defineProps<{
  items: NavItem[]
  variant: 'full' | 'icon-only'
}>()

const { t } = useI18n()
const route = useRoute()
const drawerOpen = ref(false)

watch(() => route.fullPath, () => (drawerOpen.value = false))
</script>

<template>
  <!-- Mobile: the sidebar collapses into a slide-out drawer. -->
  <Sheet v-model:open="drawerOpen">
    <SheetTrigger as-child>
      <button type="button" class="drawer-trigger" :aria-label="t('nav.menu')">
        <Menu :size="20" aria-hidden="true" />
      </button>
    </SheetTrigger>
    <SheetContent side="left" class="w-[var(--sidebar-width)] p-0">
      <SheetTitle class="px-5 pt-5 text-base font-bold">{{ t('app.name') }}</SheetTitle>
      <nav class="sidebar drawer-nav full">
        <router-link
          v-for="item in props.items"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          active-class="active"
        >
          <component :is="item.icon" :size="18" class="icon" aria-hidden="true" />
          <span class="label">{{ item.label }}</span>
        </router-link>
      </nav>
    </SheetContent>
  </Sheet>

  <nav class="sidebar desktop-sidebar" :class="props.variant">
    <router-link
      v-for="item in props.items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      active-class="active"
      :title="props.variant === 'icon-only' ? item.label : undefined"
    >
      <component :is="item.icon" :size="18" class="icon" aria-hidden="true" />
      <span v-if="props.variant === 'full'" class="label">{{ item.label }}</span>
      <span v-else class="visually-hidden">{{ item.label }}</span>
    </router-link>
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

.drawer-nav {
  border-right: none;
  width: 100%;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3);
  border-radius: var(--radius-md);
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: var(--font-size-sm);
  font-weight: 600;
  border-left: 2px solid transparent;
  transition:
    background-color 150ms ease,
    color 150ms ease;
}

.nav-item:hover {
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  color: var(--color-text);
}

.nav-item:active {
  transform: scale(0.98);
}

.nav-item.active {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  border-left-color: var(--color-primary);
}

.icon {
  flex: none;
}

.drawer-trigger {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
}

.drawer-trigger:hover {
  background: var(--color-bg);
}

@media (max-width: 900px) {
  .desktop-sidebar {
    display: none;
  }

  .drawer-trigger {
    display: inline-flex;
    position: fixed;
    top: 12px;
    left: 12px;
    z-index: 40;
  }
}
</style>
