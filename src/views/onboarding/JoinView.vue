<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { KeyRound } from '@lucide/vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import * as orgsApi from '@/api/orgs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const { t } = useI18n()
const router = useRouter()

type Step = 'code' | 'password'
const step = ref<Step>('code')

const code = ref('')
const companyName = ref('')
const requiresCompanyPassword = ref(false)
const companyPassword = ref('')
const submitting = ref(false)
const errorMessage = ref('')

async function handleCheckCode() {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await orgsApi.checkJoinCode(code.value)
    if (!res.valid) {
      errorMessage.value = t('join.invalidCode')
      return
    }
    companyName.value = res.companyName ?? ''
    if (res.requiresCompanyPassword) {
      requiresCompanyPassword.value = true
      step.value = 'password'
      return
    }
    router.push({ name: 'join-register', params: { code: code.value.trim().toUpperCase() } })
  } catch {
    errorMessage.value = t('join.invalidCode')
  } finally {
    submitting.value = false
  }
}

async function handleCheckPassword() {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await orgsApi.verifyCompanyPassword(code.value, companyPassword.value)
    if (!res.valid) {
      errorMessage.value = t('join.invalidPassword')
      return
    }
    router.push({ name: 'join-register', params: { code: code.value.trim().toUpperCase() } })
  } catch {
    errorMessage.value = t('join.invalidPassword')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="join-card panel">
      <h1>{{ t('join.title') }}</h1>

      <form v-if="step === 'code'" @submit.prevent="handleCheckCode">
        <div class="field">
          <label for="join-code">{{ t('join.codeLabel') }}</label>
          <Input
            id="join-code"
            v-model="code"
            :placeholder="t('join.codePlaceholder')"
            maxlength="6"
            class="code-input"
            required
          />
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('join.checking') : t('join.continue') }}
        </Button>
      </form>

      <form v-else @submit.prevent="handleCheckPassword">
        <p class="found-company">
          <KeyRound :size="15" aria-hidden="true" />
          {{ t('join.foundCompany') }}: <strong>{{ companyName }}</strong>
        </p>
        <div class="field">
          <label for="join-company-password">{{ t('join.companyPasswordLabel') }}</label>
          <Input id="join-company-password" v-model="companyPassword" type="password" required />
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('join.verifying') : t('join.continue') }}
        </Button>
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped>
.join-card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
}

h1 {
  margin: 0 0 var(--space-5);
  font-size: var(--font-size-xl);
  letter-spacing: -0.02em;
}

.field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.code-input {
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 700;
}

.found-company {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-sm);
  color: var(--color-muted-foreground);
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
</style>
