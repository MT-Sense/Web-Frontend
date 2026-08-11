<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { CurrentUser } from '@/types/user'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ user: CurrentUser }>()
const open = ref(false)
const router = useRouter()
const auth = useAuthStore()
const { t } = useI18n()

function initials(name: string) {
  return name.trim().slice(0, 1)
}

function handleSettings() {
  open.value = false
  router.push('/settings')
}

function handleLogout() {
  open.value = false
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="avatar-menu">
    <button type="button" class="avatar" @click="open = !open">{{ initials(props.user.fullName) }}</button>
    <div v-if="open" class="menu">
      <div class="menu-name">{{ props.user.fullName }}</div>
      <button type="button" @click="handleSettings">{{ t('nav.settings') }}</button>
      <button type="button" @click="handleLogout">{{ t('common.logout') }}</button>
    </div>
  </div>
</template>

<style scoped>
.avatar-menu {
  position: relative;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: var(--color-primary);
  color: white;
  font-weight: 700;
  cursor: pointer;
}

.menu {
  position: absolute;
  right: 0;
  top: 44px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  min-width: 160px;
  padding: var(--space-2);
  z-index: 20;
  display: flex;
  flex-direction: column;
}

.menu-name {
  padding: var(--space-2);
  font-weight: 600;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: var(--space-1);
}

.menu button {
  border: none;
  background: none;
  text-align: left;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.menu button:hover {
  background: var(--color-bg);
}
</style>
