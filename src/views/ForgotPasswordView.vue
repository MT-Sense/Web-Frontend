<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import * as authApi from '@/api/auth'

const { t } = useI18n()
const email = ref('')
const submitting = ref(false)
const sent = ref(false)
const errorMessage = ref('')

async function submit() {
  if (submitting.value) return
  submitting.value = true
  errorMessage.value = ''
  try {
    await authApi.forgotPassword(email.value.trim())
    // The API answers the same whether or not the email has an account.
    sent.value = true
  } catch {
    errorMessage.value = t('password.forgotError')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="card panel">
      <h1>{{ t('password.forgotTitle') }}</h1>
      <template v-if="sent">
        <p>{{ t('password.forgotSent', { email: email.trim() }) }}</p>
        <RouterLink to="/login">{{ t('password.backToLogin') }}</RouterLink>
      </template>
      <form v-else @submit.prevent="submit">
        <p class="hint">{{ t('password.forgotHint') }}</p>
        <label for="forgot-email">{{ t('login.email') }}</label>
        <Input id="forgot-email" v-model="email" type="email" autocomplete="username" required />
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('password.sending') : t('password.sendLink') }}
        </Button>
        <RouterLink to="/login">{{ t('password.backToLogin') }}</RouterLink>
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped>
.card {
  width: 100%;
  max-width: 420px;
  padding: var(--space-6);
  box-shadow: var(--shadow-lg);
  display: grid;
  gap: var(--space-3);
}

form {
  display: grid;
  gap: var(--space-3);
}

h1 {
  margin: 0;
  font-size: var(--font-size-xl);
}

.hint,
label {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

a {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  justify-self: center;
}
</style>
