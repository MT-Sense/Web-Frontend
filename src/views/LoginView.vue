<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import RoleBadge from '@/components/layout/RoleBadge.vue'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/types/user'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)

// Dev-only stand-in for real auth: role is detected server-side after login,
// never chosen by the user. This picker exists only because there's no backend yet.
const devRole = ref<Role>('HR')
const roles: Role[] = ['HR', 'Executive', 'Employee']

function handleSubmit() {
  auth.switchRole(devRole.value)
  router.push(auth.homeRouteFor(devRole.value))
}
</script>

<template>
  <AuthLayout>
    <div class="login-card">
      <h1>{{ t('login.title') }}</h1>
      <p class="privacy-banner">🔒 {{ t('login.privacyBanner') }}</p>

      <form @submit.prevent="handleSubmit">
        <label class="field">
          <span>{{ t('login.email') }}</span>
          <input v-model="email" type="email" autocomplete="username" />
        </label>
        <label class="field">
          <span>{{ t('login.password') }}</span>
          <input v-model="password" type="password" autocomplete="current-password" />
        </label>

        <div class="row">
          <label class="checkbox">
            <input v-model="rememberMe" type="checkbox" />
            <span>{{ t('login.rememberMe') }}</span>
          </label>
          <a href="#" @click.prevent>{{ t('login.forgotPassword') }}</a>
        </div>

        <div class="dev-role-picker">
          <p class="dev-hint">{{ t('login.devHint') }}</p>
          <div class="role-options">
            <button
              v-for="role in roles"
              :key="role"
              type="button"
              class="role-option"
              :class="{ active: devRole === role }"
              @click="devRole = role"
            >
              <RoleBadge :role="role" />
            </button>
          </div>
        </div>

        <button type="submit" class="submit">{{ t('login.submit') }}</button>
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
}

h1 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-xl);
}

.privacy-banner {
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: var(--space-3);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin: 0 0 var(--space-5);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.field input {
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-5);
  font-size: var(--font-size-sm);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
}

.dev-role-picker {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  margin-bottom: var(--space-5);
}

.dev-hint {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.role-options {
  display: flex;
  gap: var(--space-2);
}

.role-option {
  border: 2px solid transparent;
  background: none;
  border-radius: 999px;
  cursor: pointer;
  padding: 0;
}

.role-option.active {
  border-color: var(--color-primary);
  border-radius: 999px;
}

.submit {
  width: 100%;
  padding: var(--space-3);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}

.submit:hover {
  background: var(--color-primary-hover);
}
</style>
