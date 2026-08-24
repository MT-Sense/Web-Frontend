<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import { useAuthStore } from '@/stores/auth'
import { ApiError } from '@/api/client'
import * as orgsApi from '@/api/orgs'
import type { JoinCodeOption } from '@/api/orgs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import DropdownSelect from '@/components/common/DropdownSelect.vue'

const props = defineProps<{ code: string }>()

const { t } = useI18n()
const auth = useAuthStore()
const router = useRouter()

const loading = ref(true)
const loadError = ref(false)
const requiresCompanyPassword = ref(false)
const collectDepartment = ref(false)
const collectTenure = ref(false)
const departments = ref<JoinCodeOption[]>([])

const firstName = ref('')
const lastName = ref('')
const position = ref('')
const email = ref('')
const password = ref('')
const companyPassword = ref('')
const departmentId = ref('')
const tenureBucket = ref('')

const submitting = ref(false)
const errorMessage = ref('')

const tenureOptions = [
  { value: 'under_1y', label: () => t('register.tenureUnder1y') },
  { value: '1_3y', label: () => t('register.tenure1to3y') },
  { value: '3_5y', label: () => t('register.tenure3to5y') },
  { value: '5y_plus', label: () => t('register.tenure5yPlus') },
]

onMounted(async () => {
  try {
    const res = await orgsApi.checkJoinCode(props.code)
    if (!res.valid) {
      loadError.value = true
      return
    }
    requiresCompanyPassword.value = res.requiresCompanyPassword
    collectDepartment.value = res.collectDepartment
    collectTenure.value = res.collectTenure
    departments.value = res.departments ?? []
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
})

async function handleSubmit() {
  if (submitting.value) return
  errorMessage.value = ''
  submitting.value = true
  try {
    const res = await orgsApi.registerEmployee({
      code: props.code,
      companyPassword: requiresCompanyPassword.value ? companyPassword.value : undefined,
      firstName: firstName.value,
      lastName: lastName.value,
      position: position.value,
      email: email.value,
      password: password.value,
      departmentId: collectDepartment.value ? departmentId.value : undefined,
      tenureBucket: collectTenure.value ? tenureBucket.value : undefined,
    })
    auth.completeRegistration(res)
    router.push(auth.homeRouteFor(auth.currentRole!))
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      errorMessage.value = t('register.emailTaken')
    } else {
      errorMessage.value = t('register.genericError')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <div class="register-card panel">
      <h1>{{ t('register.title') }}</h1>

      <p v-if="loading" class="hint">{{ t('common.loading') }}</p>
      <p v-else-if="loadError" class="error-message" role="alert">{{ t('join.invalidCode') }}</p>

      <form v-else @submit.prevent="handleSubmit">
        <div class="field-row">
          <div class="field">
            <label for="register-first-name">{{ t('register.firstName') }}</label>
            <Input id="register-first-name" v-model="firstName" required />
          </div>
          <div class="field">
            <label for="register-last-name">{{ t('register.lastName') }}</label>
            <Input id="register-last-name" v-model="lastName" required />
          </div>
        </div>

        <div class="field">
          <label for="register-position">{{ t('register.position') }}</label>
          <Input id="register-position" v-model="position" required />
        </div>

        <div v-if="collectDepartment" class="field">
          <label>{{ t('register.department') }}</label>
          <DropdownSelect
            v-model="departmentId"
            :options="departments.map((d) => ({ value: d.id, label: d.name }))"
          />
        </div>

        <div v-if="collectTenure" class="field">
          <label>{{ t('register.tenure') }}</label>
          <DropdownSelect
            v-model="tenureBucket"
            :options="tenureOptions.map((o) => ({ value: o.value, label: o.label() }))"
          />
        </div>

        <div class="field">
          <label for="register-email">{{ t('register.email') }}</label>
          <Input id="register-email" v-model="email" type="email" autocomplete="username" required />
        </div>
        <div class="field">
          <label for="register-password">{{ t('register.password') }}</label>
          <Input id="register-password" v-model="password" type="password" autocomplete="new-password" required />
        </div>

        <div v-if="requiresCompanyPassword" class="field">
          <label for="register-company-password">{{ t('join.companyPasswordLabel') }}</label>
          <Input id="register-company-password" v-model="companyPassword" type="password" required />
        </div>

        <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>

        <Button type="submit" size="lg" class="w-full" :disabled="submitting">
          {{ submitting ? t('register.submitting') : t('register.submit') }}
        </Button>
      </form>
    </div>
  </AuthLayout>
</template>

<style scoped>
.register-card {
  width: 100%;
  max-width: 480px;
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

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.hint {
  color: var(--color-muted-foreground);
  font-size: var(--font-size-sm);
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
  .field-row {
    grid-template-columns: 1fr;
  }
}
</style>
