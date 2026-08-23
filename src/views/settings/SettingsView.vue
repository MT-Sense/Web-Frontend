<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Check, Circle } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import * as authApi from '@/api/auth'
import * as settingsApi from '@/api/settings'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const { layoutComponent } = useRoleLayout()
const auth = useAuthStore()
const router = useRouter()

async function handleLogoutAllDevices() {
  await auth.logout()
  router.push('/login')
}

const { data: history } = useAsyncData(() => settingsApi.submissionHistory())

const savingNewRound = ref(false)
const savingMonthlySummary = ref(false)

async function updateNotifyNewRound(value: boolean) {
  if (!auth.currentUser || savingNewRound.value) return
  savingNewRound.value = true
  try {
    auth.currentUser = await authApi.updateMe({ notifyNewRound: value })
  } finally {
    savingNewRound.value = false
  }
}

async function updateNotifyMonthlySummary(value: boolean) {
  if (!auth.currentUser || savingMonthlySummary.value) return
  savingMonthlySummary.value = true
  try {
    auth.currentUser = await authApi.updateMe({ notifyMonthlySummary: value })
  } finally {
    savingMonthlySummary.value = false
  }
}

function toggleLocale() {
  setLocale(locale.value === 'th' ? 'en' : 'th')
}
</script>

<template>
  <component :is="layoutComponent" :breadcrumb="t('nav.settings')">
    <div v-if="auth.currentUser" class="settings">
      <section class="panel">
        <h2>{{ t('settings.userInfo') }}</h2>
        <dl>
          <dt>{{ auth.currentUser.fullName }}</dt>
          <dd>
            {{ t(`role.${auth.currentUser.role}`) }} · {{ auth.currentUser.department }}
            <template v-if="auth.currentUser.position"> · {{ auth.currentUser.position }}</template>
          </dd>
          <dd class="muted">{{ auth.currentUser.lastLoginAt }}</dd>
        </dl>
      </section>

      <section class="panel">
        <h2>{{ t('settings.notifications') }}</h2>
        <label class="toggle-row">
          <Switch
            :model-value="auth.currentUser.notifyNewRound"
            :disabled="savingNewRound"
            @update:model-value="updateNotifyNewRound"
          />
          {{ t('settings.notifyNewRound') }}
        </label>
        <label v-if="auth.currentRole === 'admin' || auth.currentRole === 'executive'" class="toggle-row">
          <Switch
            :model-value="auth.currentUser.notifyMonthlySummary"
            :disabled="savingMonthlySummary"
            @update:model-value="updateNotifyMonthlySummary"
          />
          {{ t('settings.notifyMonthlySummary') }}
        </label>
      </section>

      <section class="panel">
        <h2>{{ t('settings.language') }}</h2>
        <Button variant="secondary" @click="toggleLocale">
          {{ locale === 'th' ? 'English' : 'ไทย' }}
        </Button>
      </section>

      <section class="panel privacy-box">
        <h2>{{ t('privacy.myPrivacyTitle') }}</h2>
        <p>{{ t('privacy.myPrivacyBody') }}</p>
        <h3>{{ t('settings.submittedHistory') }}</h3>
        <ul>
          <li v-for="entry in history ?? []" :key="entry.periodId">
            <Check v-if="entry.status === 'submitted'" :size="14" class="log-icon done" aria-hidden="true" />
            <Circle v-else :size="14" class="log-icon" aria-hidden="true" />
            {{ entry.year }}-{{ String(entry.month).padStart(2, '0') }} — {{ entry.status }}
          </li>
        </ul>
        <div class="actions">
          <Button variant="secondary">{{ t('settings.changePassword') }}</Button>
          <Button variant="secondary" @click="handleLogoutAllDevices">{{ t('settings.logoutAllDevices') }}</Button>
        </div>
      </section>
    </div>
  </component>
</template>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 640px;
}

.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

dl {
  margin: 0;
}

dt {
  font-weight: 700;
}

dd {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

dd.muted {
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-3);
  cursor: pointer;
}

.privacy-box {
  background: var(--color-accent-100);
  box-shadow: inset 0 0 0 1px var(--color-accent-200);
}

.privacy-box p {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.privacy-box h3 {
  font-size: var(--font-size-sm);
  margin: var(--space-3) 0 var(--space-2);
}

.privacy-box ul {
  list-style: none;
  margin: 0 0 var(--space-4);
  padding: 0;
  font-size: var(--font-size-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.privacy-box li {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.log-icon {
  flex: none;
  color: var(--color-text-subtle);
}

.log-icon.done {
  color: var(--color-positive);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
