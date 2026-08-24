<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Lock } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const rememberMe = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

async function handleSubmit() {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    await auth.login(email.value, password.value)
    router.push(auth.homeRouteFor(auth.currentRole!))
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      errorMessage.value = t('login.invalidCredentials')
    } else {
      errorMessage.value = t('login.genericError')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="login-card panel">
      <h1>{{ t('login.title') }}</h1>
      <p class="privacy-banner">
        <Lock :size="15" aria-hidden="true" />
        <span>{{ t('login.privacyBanner') }}</span>
      </p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="login-email">{{ t('login.email') }}</label>
          <Input id="login-email" v-model="email" type="email" autocomplete="username" placeholder="name@company.com" required />
        </div>
        <div class="field">
          <label for="login-password">{{ t('login.password') }}</label>
          <Input id="login-password" v-model="password" type="password" autocomplete="current-password" placeholder="••••••••" required />
        </div>

        <div class="row">
          <label class="checkbox">
            <Checkbox v-model="rememberMe" />
            <span>{{ t('login.rememberMe') }}</span>
          </label>
          <a href="#" @click.prevent>{{ t('login.forgotPassword') }}</a>
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('login.submitting') : t('login.submit') }}
        </Button>
      </form>

      <div class="onboarding-links">
        <RouterLink to="/signup">{{ t('login.newCompany') }}</RouterLink>
        <RouterLink to="/join">{{ t('login.haveJoinCode') }}</RouterLink>
      </div>
    </div>
  </AuthLayout>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  animation: rise 400ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-card {
    animation: none;
  }
}

h1 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-xl);
  letter-spacing: -0.02em;
}

.privacy-banner {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  background: var(--color-accent-100);
  box-shadow: inset 0 0 0 1px var(--color-accent-200);
  color: var(--color-accent-700);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sm);
  font-weight: 600;
  line-height: 1.5;
  margin: 0 0 var(--space-5);
}

.privacy-banner svg {
  flex: none;
  margin-top: 2px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-5);
  font-size: var(--font-size-sm);
}

.checkbox {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-weight: 500;
  cursor: pointer;
}

.error-message {
  margin: 0 0 var(--space-4);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

@media (max-width: 480px) {
  .login-card {
    padding: var(--space-5) var(--space-4);
  }

  .row {
    flex-direction: column;
    align-items: flex-start;
  }
}

.onboarding-links {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  margin-top: var(--space-5);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  font-size: var(--font-size-sm);
}
</style>
