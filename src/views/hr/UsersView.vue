<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { KeyRound, Mail, Pencil, Plus, Wand2 } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import * as usersApi from '@/api/users'
import * as departmentsApi from '@/api/departments'
import * as dashboardApi from '@/api/dashboard'
import type { Role } from '@/types/user'

const { t, locale } = useI18n()
const { toast } = useToast()
const auth = useAuthStore()

const { data: users, loading, error, reload } = useAsyncData(() => usersApi.list())
const { data: departments } = useAsyncData(() => departmentsApi.list())
const { data: positions, reload: reloadPositions } = useAsyncData(() => dashboardApi.positions())

const roles: Role[] = ['employee', 'executive', 'admin']

// --- filters ---
const search = ref('')
const departmentFilter = ref('all')
const roleFilter = ref<'all' | Role>('all')
const statusFilter = ref<'active' | 'inactive' | 'all'>('active')

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (users.value ?? []).filter((u) =>
    (!q || u.fullName.toLowerCase().includes(q) || u.email.includes(q)) &&
    (departmentFilter.value === 'all' || (departmentFilter.value === 'none' ? !u.departmentId : u.departmentId === departmentFilter.value)) &&
    (roleFilter.value === 'all' || u.role === roleFilter.value) &&
    (statusFilter.value === 'all' || (statusFilter.value === 'active') === u.isActive),
  )
})
const counts = computed(() => ({
  active: (users.value ?? []).filter((u) => u.isActive).length,
  inactive: (users.value ?? []).filter((u) => !u.isActive).length,
}))

function formatDate(value: string | null) {
  if (!value) return t('users.never')
  return new Date(value).toLocaleDateString(locale.value === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}

// --- add / edit dialog ---
const dialogOpen = ref(false)
const editing = ref<usersApi.ManagedUser | null>(null)
const form = reactive({ fullName: '', email: '', role: 'employee' as Role, departmentId: '', position: '', isActive: true, password: '' })
const saving = ref(false)
const formError = ref('')
const isSelf = computed(() => editing.value?.id === auth.currentUser?.id)

function generatePassword() {
  // Avoids look-alike characters so it can be read out or typed from a note.
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

function openCreate() {
  editing.value = null
  Object.assign(form, { fullName: '', email: '', role: 'employee', departmentId: '', position: '', isActive: true, password: generatePassword() })
  formError.value = ''
  tempPassword.value = ''
  dialogOpen.value = true
}

function openEdit(user: usersApi.ManagedUser) {
  editing.value = user
  Object.assign(form, {
    fullName: user.fullName, email: user.email, role: user.role, departmentId: user.departmentId,
    position: user.positionName, isActive: user.isActive, password: '',
  })
  formError.value = ''
  tempPassword.value = ''
  dialogOpen.value = true
}

const departmentMoved = computed(() => !!editing.value && editing.value.departmentId !== form.departmentId)

async function save() {
  if (saving.value) return
  saving.value = true
  formError.value = ''
  try {
    if (editing.value) {
      const before = editing.value
      const payload: usersApi.UpdateUserPayload = {}
      if (form.fullName.trim() !== before.fullName) payload.fullName = form.fullName.trim()
      if (form.email.trim().toLowerCase() !== before.email) payload.email = form.email.trim()
      if (form.role !== before.role) payload.role = form.role
      if (form.departmentId !== before.departmentId) payload.departmentId = form.departmentId
      if (form.position.trim() !== before.positionName) payload.position = form.position.trim()
      if (form.isActive !== before.isActive) payload.isActive = form.isActive
      if (Object.keys(payload).length) await usersApi.update(before.id, payload)
      toast.success(t('users.saved'))
    } else {
      await usersApi.create({
        fullName: form.fullName.trim(), email: form.email.trim(), role: form.role,
        departmentId: form.departmentId, position: form.position.trim(), password: form.password,
      })
      toast.success(t('users.created'), t('users.createdDetail', { email: form.email.trim(), password: form.password }), 15000)
    }
    dialogOpen.value = false
    await Promise.all([reload(), reloadPositions()])
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

// --- password actions (edit mode) ---
const tempPassword = ref('')
const passwordBusy = ref(false)

async function setTempPassword() {
  if (!editing.value || passwordBusy.value) return
  passwordBusy.value = true
  try {
    await usersApi.setPassword(editing.value.id, tempPassword.value)
    toast.success(t('users.passwordSet'), t('users.passwordSetDetail', { password: tempPassword.value }), 15000)
    tempPassword.value = ''
  } catch (e) {
    toast.error(t('users.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    passwordBusy.value = false
  }
}

async function sendReset() {
  if (!editing.value || passwordBusy.value) return
  passwordBusy.value = true
  try {
    const result = await usersApi.sendResetEmail(editing.value.id)
    if (result.smtpConfigured) toast.success(t('users.resetSent'), t('users.resetSentDetail', { email: result.sentTo }))
    else toast.info(t('users.resetLogged'))
  } catch (e) {
    toast.error(t('users.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    passwordBusy.value = false
  }
}
</script>

<template>
  <HrLayout :breadcrumb="t('nav.users')">
    <div class="users-page">
      <section class="panel">
        <div class="header">
          <div>
            <h2>{{ t('users.title') }}</h2>
            <p class="hint">{{ t('users.hint') }}</p>
          </div>
          <Button size="sm" @click="openCreate">
            <Plus :size="15" aria-hidden="true" />
            {{ t('users.add') }}
          </Button>
        </div>

        <div class="filters">
          <Input v-model="search" :placeholder="t('users.search')" class="search" />
          <select v-model="departmentFilter" :aria-label="t('users.department')">
            <option value="all">{{ t('users.allDepartments') }}</option>
            <option value="none">{{ t('users.noDepartment') }}</option>
            <option v-for="d in departments ?? []" :key="d.id" :value="d.id">{{ d.name }}</option>
          </select>
          <select v-model="roleFilter" :aria-label="t('users.role')">
            <option value="all">{{ t('users.allRoles') }}</option>
            <option v-for="r in roles" :key="r" :value="r">{{ t(`role.${r}`) }}</option>
          </select>
          <select v-model="statusFilter" :aria-label="t('users.status')">
            <option value="active">{{ t('users.activeCount', { count: counts.active }) }}</option>
            <option value="inactive">{{ t('users.inactiveCount', { count: counts.inactive }) }}</option>
            <option value="all">{{ t('users.allStatuses') }}</option>
          </select>
        </div>

        <p v-if="loading && !users">{{ t('common.loading') }}</p>
        <Alert v-else-if="error" variant="destructive">
          <AlertDescription>
            {{ t('common.loadError') }}
            <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
          </AlertDescription>
        </Alert>
        <p v-else-if="filtered.length === 0" class="hint">{{ t('users.empty') }}</p>

        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>{{ t('users.name') }}</th>
                <th>{{ t('users.role') }}</th>
                <th>{{ t('users.department') }}</th>
                <th>{{ t('users.position') }}</th>
                <th>{{ t('users.lastLogin') }}</th>
                <th><span class="visually-hidden">{{ t('common.edit') }}</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in filtered" :key="u.id" :class="{ inactive: !u.isActive }">
                <td>
                  <strong>{{ u.fullName }}</strong>
                  <span v-if="u.id === auth.currentUser?.id" class="tag">{{ t('users.you') }}</span>
                  <span v-if="!u.isActive" class="tag muted-tag">{{ t('users.inactive') }}</span>
                  <div class="email">{{ u.email }}</div>
                </td>
                <td>{{ t(`role.${u.role}`) }}</td>
                <td>{{ u.departmentName || '—' }}</td>
                <td>{{ u.positionName || '—' }}</td>
                <td>{{ formatDate(u.lastLoginAt) }}</td>
                <td>
                  <Button size="sm" variant="secondary" @click="openEdit(u)">
                    <Pencil :size="14" aria-hidden="true" />
                    {{ t('common.edit') }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <Dialog v-model:open="dialogOpen">
      <DialogContent class="user-dialog">
        <DialogHeader>
          <DialogTitle>{{ editing ? t('users.editTitle') : t('users.addTitle') }}</DialogTitle>
          <DialogDescription>{{ t('users.dialogHint') }}</DialogDescription>
        </DialogHeader>

        <form class="form" @submit.prevent="save">
          <label>
            {{ t('users.name') }}
            <Input v-model="form.fullName" maxlength="100" required />
          </label>
          <label>
            {{ t('users.email') }}
            <Input v-model="form.email" type="email" required />
          </label>
          <div class="two">
            <label>
              {{ t('users.role') }}
              <select v-model="form.role" :disabled="isSelf">
                <option v-for="r in roles" :key="r" :value="r">{{ t(`role.${r}`) }}</option>
              </select>
            </label>
            <label>
              {{ t('users.department') }}
              <select v-model="form.departmentId">
                <option value="">{{ t('users.noDepartment') }}</option>
                <option v-for="d in departments ?? []" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </label>
          </div>
          <label>
            {{ t('users.position') }}
            <Input v-model="form.position" list="position-options" maxlength="255" :placeholder="t('users.positionPlaceholder')" />
            <datalist id="position-options">
              <option v-for="p in positions ?? []" :key="p.id" :value="p.name" />
            </datalist>
          </label>
          <p v-if="isSelf" class="note">{{ t('users.selfNote') }}</p>
          <p v-if="departmentMoved" class="note">{{ t('users.departmentNote') }}</p>

          <label v-if="!editing">
            {{ t('users.tempPassword') }}
            <div class="inline">
              <Input v-model="form.password" minlength="8" maxlength="72" required />
              <Button type="button" size="sm" variant="secondary" :aria-label="t('users.generate')" @click="form.password = generatePassword()">
                <Wand2 :size="14" aria-hidden="true" />
              </Button>
            </div>
            <span class="note">{{ t('users.tempPasswordHint') }}</span>
          </label>

          <label v-if="editing" class="switch-row">
            <Switch v-model="form.isActive" :disabled="isSelf" />
            {{ form.isActive ? t('users.active') : t('users.inactive') }}
            <span class="note">{{ t('users.deactivateHint') }}</span>
          </label>

          <p v-if="formError" class="error" role="alert">{{ formError }}</p>
          <DialogFooter>
            <Button type="button" variant="secondary" :disabled="saving" @click="dialogOpen = false">{{ t('common.cancel') }}</Button>
            <Button type="submit" :disabled="saving">{{ editing ? t('common.save') : t('users.add') }}</Button>
          </DialogFooter>
        </form>

        <section v-if="editing" class="password-box">
          <h3>{{ t('users.passwordTitle') }}</h3>
          <div class="inline">
            <Input v-model="tempPassword" :placeholder="t('users.tempPassword')" minlength="8" maxlength="72" />
            <Button type="button" size="sm" variant="secondary" :aria-label="t('users.generate')" @click="tempPassword = generatePassword()">
              <Wand2 :size="14" aria-hidden="true" />
            </Button>
            <Button type="button" size="sm" variant="secondary" :disabled="passwordBusy || tempPassword.length < 8" @click="setTempPassword">
              <KeyRound :size="14" aria-hidden="true" />
              {{ t('users.setPassword') }}
            </Button>
          </div>
          <Button type="button" size="sm" variant="secondary" :disabled="passwordBusy || !editing.isActive" @click="sendReset">
            <Mail :size="14" aria-hidden="true" />
            {{ t('users.sendReset') }}
          </Button>
          <p class="note">{{ t('users.passwordHint') }}</p>
        </section>
      </DialogContent>
    </Dialog>
  </HrLayout>
</template>

<style scoped>
.users-page {
  max-width: 1100px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}

h2 {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-md);
  font-weight: 600;
}

h3 {
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: 700;
}

.hint,
.note {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.note {
  font-size: var(--font-size-xs);
  font-weight: 400;
}

.error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.filters .search {
  max-width: 260px;
}

select {
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 var(--space-2);
  font: inherit;
  font-size: var(--font-size-sm);
  font-weight: 400;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);
}

th {
  text-align: left;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  font-weight: 600;
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
}

td {
  padding: var(--space-2);
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
}

tr.inactive td {
  color: var(--color-text-subtle);
}

.email {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
  overflow-wrap: anywhere;
}

.tag {
  margin-left: var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 1px var(--space-2);
  border-radius: 999px;
  background: var(--color-accent-100);
  color: var(--color-accent-700);
}

.muted-tag {
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.form {
  display: grid;
  gap: var(--space-3);
}

.form label {
  display: grid;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.two {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.inline {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}

.form .switch-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.switch-row .note {
  flex-basis: 100%;
}

.password-box {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  justify-items: start;
}

.password-box .inline {
  width: 100%;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

@media (max-width: 560px) {
  .two {
    grid-template-columns: 1fr;
  }
}
</style>
