<script setup lang="ts">
import type { Component } from 'vue'
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Menu, PanelLeftClose, PanelLeftOpen } from '@lucide/vue'
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
const collapsed = ref(props.variant === 'icon-only')
const storageKey = `mt-sense-sidebar-${props.variant}`

onMounted(() => {
  try {
    const saved = window.localStorage.getItem(storageKey)
    if (saved === 'true' || saved === 'false') collapsed.value = saved === 'true'
  } catch {
    // Browsers that block storage can still use the toggle for this visit.
  }
})

watch(collapsed, (value) => {
  try {
    window.localStorage.setItem(storageKey, String(value))
  } catch {
    // Keep the current page usable when storage is unavailable.
  }
})

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

  <nav class="sidebar desktop-sidebar" :class="collapsed ? 'icon-only' : 'full'">
    <div class="sidebar-top">
      <span v-if="!collapsed" class="sidebar-name">{{ t('app.name') }}</span>
      <button
        type="button"
        class="collapse-button"
        :aria-label="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        :aria-pressed="collapsed"
        :title="collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')"
        @click="collapsed = !collapsed"
      >
        <PanelLeftOpen v-if="collapsed" :size="20" aria-hidden="true" />
        <PanelLeftClose v-else :size="20" aria-hidden="true" />
      </button>
    </div>
    <router-link
      v-for="item in props.items"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      active-class="active"
      :title="collapsed ? item.label : undefined"
    >
      <component :is="item.icon" :size="18" class="icon" aria-hidden="true" />
      <span v-if="!collapsed" class="label">{{ item.label }}</span>
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
  height: 100dvh;
  position: sticky;
  top: 0;
  overflow-y: auto;
}

.sidebar.full {
  width: var(--sidebar-width);
}

.sidebar.icon-only {
  width: var(--sidebar-width-collapsed);
  align-items: center;
}

.sidebar-top {
  position: sticky;
  top: 0;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 40px;
  margin-bottom: var(--space-2);
  background: var(--color-surface);
}

.icon-only .sidebar-top { justify-content: center; }
.sidebar-name { padding-left: var(--space-2); font-size: var(--font-size-sm); font-weight: 700; }

.collapse-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.collapse-button:hover { background: var(--color-bg); color: var(--color-text); }

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
