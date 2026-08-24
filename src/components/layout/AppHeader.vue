<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages } from '@lucide/vue'
import { setLocale } from '@/i18n'
import RoleBadge from './RoleBadge.vue'
import AvatarMenu from '../common/AvatarMenu.vue'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'

withDefaults(
  defineProps<{
    breadcrumb?: string
    showRole?: boolean
  }>(),
  { showRole: true },
)

const { locale, t } = useI18n()
const auth = useAuthStore()

function toggleLocale() {
  setLocale(locale.value === 'th' ? 'en' : 'th')
}
</script>

<template>
  <header class="app-header">
    <div class="left">
      <span class="app-name">{{ t('app.name') }}</span>
      <span v-if="breadcrumb" class="breadcrumb">{{ breadcrumb }}</span>
    </div>
    <div class="right">
      <Button variant="secondary" size="sm" @click="toggleLocale">
        <Languages :size="15" aria-hidden="true" />
        {{ locale === 'th' ? 'EN' : 'TH' }}
      </Button>
      <RoleBadge v-if="showRole && auth.currentRole" :role="auth.currentRole" />
      <AvatarMenu v-if="auth.currentUser" :user="auth.currentUser" />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: 0 var(--space-5);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 20;
}

.left {
  display: flex;
  align-items: baseline;
  gap: var(--space-3);
  min-width: 0;
}

.app-name {
  font-weight: 700;
  font-size: var(--font-size-lg);
  letter-spacing: -0.015em;
  white-space: nowrap;
}

.breadcrumb {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: none;
}

/* leaves room for the sidebar's fixed drawer trigger */
@media (max-width: 900px) {
  .app-header {
    padding-left: 64px;
  }
}

@media (max-width: 640px) {
  .breadcrumb {
    display: none;
  }
}
</style>
