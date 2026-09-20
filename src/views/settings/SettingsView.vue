<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Check, Circle, Copy, RefreshCw } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { useAuthStore } from '@/stores/auth'
import { useAsyncData } from '@/composables/useAsyncData'
import * as authApi from '@/api/auth'
import * as settingsApi from '@/api/settings'
import * as orgsApi from '@/api/orgs'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const { layoutComponent } = useRoleLayout()
const auth = useAuthStore()
const router = useRouter()

const isAdmin = computed(() => auth.currentRole === 'admin')

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

// --- admin-only: join code and org settings ---

const { data: joinCodeData, reload: reloadJoinCode } = useAsyncData(() =>
  isAdmin.value ? orgsApi.getJoinCode() : Promise.resolve(null),
)
const { data: orgSettings, reload: reloadOrgSettings } = useAsyncData(() =>
  isAdmin.value ? orgsApi.getOrgSettings() : Promise.resolve(null),
)

const copied = ref(false)
async function copyJoinCode() {
  if (!joinCodeData.value) return
  await navigator.clipboard.writeText(joinCodeData.value.joinCode)
  copied.value = true
  setTimeout(() => (copied.value = false), 1500)
}

const confirmingRegenerate = ref(false)
const regenerating = ref(false)
async function regenerateJoinCode() {
  if (!confirmingRegenerate.value) {
    confirmingRegenerate.value = true
    return
  }
  regenerating.value = true
  try {
    await orgsApi.regenerateJoinCode()
    await reloadJoinCode()
  } finally {
    regenerating.value = false
    confirmingRegenerate.value = false
  }
}

const companyPasswordInput = ref('')
const savingCompanyPassword = ref(false)
async function saveCompanyPassword() {
  savingCompanyPassword.value = true
  try {
    await orgsApi.updateOrgSettings({ companyPassword: companyPasswordInput.value })
    companyPasswordInput.value = ''
    await reloadOrgSettings()
  } finally {
    savingCompanyPassword.value = false
  }
}
async function clearCompanyPassword() {
  savingCompanyPassword.value = true
  try {
    await orgsApi.updateOrgSettings({ companyPassword: '' })
    await reloadOrgSettings()
  } finally {
    savingCompanyPassword.value = false
  }
}

const savingCollectTenure = ref(false)
async function updateCollectTenure(value: boolean) {
  if (!orgSettings.value || savingCollectTenure.value) return
  savingCollectTenure.value = true
  try {
    orgSettings.value = await orgsApi.updateOrgSettings({ collectTenure: value })
  } finally {
    savingCollectTenure.value = false
  }
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

      <section v-if="isAdmin && joinCodeData" class="panel">
        <h2>{{ t('settings.joinCode.sectionTitle') }}</h2>
        <div class="join-code-row">
          <span class="join-code">{{ joinCodeData.joinCode }}</span>
          <Button variant="secondary" size="sm" @click="copyJoinCode">
            <Check v-if="copied" :size="14" aria-hidden="true" />
            <Copy v-else :size="14" aria-hidden="true" />
            {{ copied ? t('settings.joinCode.copied') : t('settings.joinCode.copy') }}
          </Button>
          <Button variant="secondary" size="sm" :disabled="regenerating" @click="regenerateJoinCode">
            <RefreshCw :size="14" aria-hidden="true" />
            {{ t('settings.joinCode.regenerate') }}
          </Button>
        </div>
        <p v-if="confirmingRegenerate" class="confirm-note">{{ t('settings.joinCode.regenerateConfirm') }}</p>
      </section>

      <section v-if="isAdmin && orgSettings" class="panel">
        <h2>{{ t('settings.joinCode.companyPasswordSectionTitle') }}</h2>
        <div class="company-password">
          <label class="toggle-row">
            <Switch
              :model-value="orgSettings.companyPasswordSet"
              :disabled="savingCompanyPassword"
              @update:model-value="(v: boolean) => (v ? null : clearCompanyPassword())"
            />
            {{ t('settings.joinCode.companyPasswordToggle') }}
            <span class="muted-inline">
              ({{
                orgSettings.companyPasswordSet
                  ? t('settings.joinCode.companyPasswordSet')
                  : t('settings.joinCode.companyPasswordNotSet')
              }})
            </span>
          </label>
          <div class="company-password-input">
            <Input
              v-model="companyPasswordInput"
              type="password"
              :placeholder="t('settings.joinCode.companyPasswordLabel')"
            />
            <Button variant="secondary" size="sm" :disabled="savingCompanyPassword" @click="saveCompanyPassword">
              {{ t('settings.joinCode.save') }}
            </Button>
          </div>
        </div>
      </section>

      <section v-if="isAdmin && orgSettings" class="panel">
        <h2>{{ t('settings.optionalFields.sectionTitle') }}</h2>
        <p class="hint">{{ t('settings.optionalFields.hint') }}</p>
        <label class="toggle-row">
          <Switch
            :model-value="orgSettings.collectTenure"
            :disabled="savingCollectTenure"
            @update:model-value="updateCollectTenure"
          />
          {{ t('settings.optionalFields.collectTenure') }}
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

.join-code-row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--space-3); margin-bottom: var(--space-3); }
.join-code { font-size: var(--font-size-lg); font-weight: 700; letter-spacing: 0.1em; color: var(--color-accent-700); }
.confirm-note { margin: 0; font-size: var(--font-size-xs); color: var(--color-danger); }

.muted-inline {
  color: var(--color-text-subtle);
  font-weight: 400;
  font-size: var(--font-size-xs);
}

.company-password-input {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-2);
  max-width: 320px;
}

.hint {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
