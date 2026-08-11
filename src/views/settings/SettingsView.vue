<script setup lang="ts">
import { reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { useAuthStore } from '@/stores/auth'
import { auditLog } from '@/mocks/auditLog'
import { setLocale } from '@/i18n'

const { t, locale } = useI18n()
const { layoutComponent } = useRoleLayout()
const auth = useAuthStore()

const notifications = reactive({
  newRound: auth.currentUser?.notifyNewRound ?? false,
  monthlySummary: auth.currentUser?.notifyMonthlySummary ?? false,
})

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
          <dd>{{ t(`role.${auth.currentUser.role}`) }} · {{ auth.currentUser.department }}</dd>
          <dd class="muted">{{ auth.currentUser.lastLoginAt }}</dd>
        </dl>
      </section>

      <section class="panel">
        <h2>{{ t('settings.notifications') }}</h2>
        <label class="toggle-row">
          <input type="checkbox" v-model="notifications.newRound" />
          {{ t('settings.notifyNewRound') }}
        </label>
        <label v-if="auth.currentRole === 'HR' || auth.currentRole === 'Executive'" class="toggle-row">
          <input type="checkbox" v-model="notifications.monthlySummary" />
          {{ t('settings.notifyMonthlySummary') }}
        </label>
      </section>

      <section class="panel">
        <h2>{{ t('settings.language') }}</h2>
        <button type="button" class="btn" @click="toggleLocale">
          {{ locale === 'th' ? 'English' : 'ไทย' }}
        </button>
      </section>

      <section class="panel privacy-box">
        <h2>{{ t('privacy.myPrivacyTitle') }}</h2>
        <p>{{ t('privacy.myPrivacyBody') }}</p>
        <h3>{{ t('settings.submittedHistory') }}</h3>
        <ul>
          <li v-for="entry in auditLog" :key="entry.surveyId">
            {{ entry.surveyId }} — {{ entry.status === 'submitted' ? '✓' : '○' }} {{ entry.status }}
          </li>
        </ul>
        <div class="actions">
          <button type="button" class="btn">{{ t('settings.changePassword') }}</button>
          <button type="button" class="btn">{{ t('settings.logoutAllDevices') }}</button>
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

.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.panel h2 {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-md);
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
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-2);
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  cursor: pointer;
}

.privacy-box {
  background: var(--color-primary-bg);
  border-color: var(--color-primary);
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
  margin: 0 0 var(--space-3);
  padding-left: var(--space-4);
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  gap: var(--space-2);
}
</style>
