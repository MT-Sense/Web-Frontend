<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Building2, Check, Copy } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'
import * as orgsApi from '@/api/orgs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const companyName = ref('')
const companySlug = ref('')
const adminFullName = ref('')
const adminEmail = ref('')
const adminPassword = ref('')
const adminPasswordConfirmation = ref('')
const passwordMismatch = computed(
  () => adminPasswordConfirmation.value !== '' && adminPassword.value !== adminPasswordConfirmation.value,
)
const submitting = ref(false)
const errorMessage = ref('')
const joinCode = ref('')
const copied = ref(false)

async function handleSubmit() {
  if (submitting.value || adminPassword.value !== adminPasswordConfirmation.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await orgsApi.signup({
      companyName: companyName.value,
      companySlug: companySlug.value || undefined,
      adminFullName: adminFullName.value,
      adminEmail: adminEmail.value,
      adminPassword: adminPassword.value,
    })
    auth.completeRegistration(res)
    joinCode.value = res.joinCode
  } catch (err) {
    errorMessage.value = err instanceof ApiError ? err.message : t('signup.genericError')
  } finally {
    submitting.value = false
  }
}

async function copyCode() {
  await navigator.clipboard.writeText(joinCode.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

function goToDepartments() {
  router.push('/departments')
}
</script>

<template>
  <AuthLayout>
    <div v-if="!joinCode" class="signup-card panel">
      <h1>{{ t('signup.title') }}</h1>
      <p class="subtitle">{{ t('signup.subtitle') }}</p>

      <form @submit.prevent="handleSubmit">
        <div class="field">
          <label for="signup-company-name">{{ t('signup.companyName') }}</label>
          <Input id="signup-company-name" v-model="companyName" required />
        </div>
        <div class="field">
          <label for="signup-company-slug">{{ t('signup.companySlug') }}</label>
          <Input id="signup-company-slug" v-model="companySlug" placeholder="acme-co" />
          <p class="hint">{{ t('signup.companySlugHint') }}</p>
        </div>
        <div class="field">
          <label for="signup-admin-name">{{ t('signup.adminFullName') }}</label>
          <Input id="signup-admin-name" v-model="adminFullName" required />
        </div>
        <div class="field">
          <label for="signup-admin-email">{{ t('signup.adminEmail') }}</label>
          <Input id="signup-admin-email" v-model="adminEmail" type="email" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="signup-admin-password">{{ t('signup.adminPassword') }}</label>
          <Input
            id="signup-admin-password"
            v-model="adminPassword"
            type="password"
            autocomplete="new-password"
            required
          />
        </div>
        <div class="field">
          <label for="signup-admin-password-confirmation">{{ t('signup.confirmPassword') }}</label>
          <Input
            id="signup-admin-password-confirmation"
            v-model="adminPasswordConfirmation"
            type="password"
            autocomplete="new-password"
            :aria-invalid="passwordMismatch"
            aria-describedby="signup-password-mismatch"
            required
          />
          <p v-if="passwordMismatch" id="signup-password-mismatch" class="field-error" role="alert">
            {{ t('signup.passwordMismatch') }}
          </p>
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <Button type="submit" size="lg" class="mt-2 w-full" :disabled="submitting || passwordMismatch">
          {{ submitting ? t('signup.submitting') : t('signup.submit') }}
        </Button>
      </form>

      <p class="switch-link">
        {{ t('signup.haveAccount') }}
        <RouterLink to="/login">{{ t('signup.login') }}</RouterLink>
      </p>
    </div>

    <div v-else class="signup-card panel">
      <Building2 :size="28" class="reveal-icon" aria-hidden="true" />
      <h1>{{ t('signup.joinCodeRevealTitle') }}</h1>
      <p class="subtitle">{{ t('signup.joinCodeRevealBody') }}</p>
      <div class="code-box">
        <span class="code">{{ joinCode }}</span>
        <Button variant="secondary" size="sm" @click="copyCode">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          {{ copied ? t('signup.copied') : t('signup.copyCode') }}
        </Button>
      </div>
      <Button size="lg" class="w-full" @click="goToDepartments">{{ t('signup.continue') }}</Button>
    </div>
  </AuthLayout>
</template>

<style scoped>
.signup-card {
  width: 100%;
  max-width: 460px;
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}

h1 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-xl);
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0 0 var(--space-5);
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.hint {
  margin: 0;
  font-weight: 400;
  color: var(--color-muted-foreground);
  font-size: var(--font-size-xs);
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

.field-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-xs);
  font-weight: 500;
}

.switch-link {
  margin: var(--space-5) 0 0;
  text-align: center;
  font-size: var(--font-size-sm);
  color: var(--color-muted-foreground);
}

.reveal-icon { color: var(--color-accent-700); }
.code-box { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); background: var(--color-accent-100); border-radius: var(--radius-md); padding: var(--space-4); margin: var(--space-2) 0 var(--space-5); }
.code { font-size: var(--font-size-xl); font-weight: 700; letter-spacing: 0.1em; color: var(--color-accent-700); }
</style>
