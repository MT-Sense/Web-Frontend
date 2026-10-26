<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/api/client'
import * as authApi from '@/api/auth'

const { t } = useI18n()
const route = useRoute()
const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))

const password = ref('')
const confirm = ref('')
const submitting = ref(false)
const done = ref(false)
const errorMessage = ref('')

async function submit() {
  if (submitting.value) return
  if (password.value !== confirm.value) {
    errorMessage.value = t('settings.password.mismatch')
    return
  }
  submitting.value = true
  errorMessage.value = ''
  try {
    await authApi.resetPassword(token.value, password.value)
    done.value = true
  } catch (e) {
    errorMessage.value = e instanceof ApiError && e.status === 400 && e.message.includes('reset link')
      ? t('password.linkInvalid')
      : e instanceof Error ? e.message : String(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="card panel">
      <h1>{{ t('password.resetTitle') }}</h1>
      <template v-if="done">
        <p>{{ t('password.resetDone') }}</p>
        <RouterLink to="/login">{{ t('password.backToLogin') }}</RouterLink>
      </template>
      <template v-else-if="!token">
        <p class="error">{{ t('password.linkInvalid') }}</p>
        <RouterLink to="/forgot-password">{{ t('password.requestNew') }}</RouterLink>
      </template>
      <form v-else @submit.prevent="submit">
        <label for="reset-password">{{ t('settings.password.new') }}</label>
        <Input id="reset-password" v-model="password" type="password" autocomplete="new-password" minlength="8" maxlength="72" required />
        <label for="reset-confirm">{{ t('settings.password.confirm') }}</label>
        <Input id="reset-confirm" v-model="confirm" type="password" autocomplete="new-password" required />
        <p class="hint">{{ t('settings.password.hint') }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('password.saving') : t('password.resetSubmit') }}
        </Button>
        <RouterLink v-if="errorMessage === t('password.linkInvalid')" to="/forgot-password">{{ t('password.requestNew') }}</RouterLink>
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
