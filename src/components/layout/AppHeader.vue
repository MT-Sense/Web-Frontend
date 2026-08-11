<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'
import RoleBadge from './RoleBadge.vue'
import AvatarMenu from '../common/AvatarMenu.vue'
import { useAuthStore } from '@/stores/auth'

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
      <button type="button" class="lang-toggle" @click="toggleLocale">
        {{ locale === 'th' ? 'EN' : 'TH' }}
      </button>
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
  padding: 0 var(--space-5);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.left {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-name {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.breadcrumb {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.lang-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-weight: 600;
}

.lang-toggle:hover {
  background: var(--color-bg);
}
</style>
