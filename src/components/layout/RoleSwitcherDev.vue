<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/user'

const auth = useAuthStore()
const router = useRouter()

const roles: Role[] = ['HR', 'Executive', 'Employee']

function pick(role: Role) {
  auth.switchRole(role)
  router.push(auth.homeRouteFor(role))
}
</script>

<template>
  <div class="dev-switcher">
    <span class="label">DEV role</span>
    <button
      v-for="role in roles"
      :key="role"
      type="button"
      :class="{ active: auth.currentRole === role }"
      @click="pick(role)"
    >
      {{ role }}
    </button>
  </div>
</template>

<style scoped>
.dev-switcher {
  position: fixed;
  bottom: var(--space-4);
  right: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background: var(--color-text);
  color: white;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  z-index: 100;
  font-size: var(--font-size-xs);
}

.label {
  opacity: 0.7;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

button {
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: transparent;
  color: white;
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  font-weight: 600;
  transition:
    background-color 150ms ease,
    transform 150ms ease;
}

button:active {
  transform: scale(0.94);
}

button.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-accent-100);
}
</style>
