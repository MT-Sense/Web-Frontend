<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Building2, Pencil, Plus, Trash2 } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAsyncData } from '@/composables/useAsyncData'
import * as departmentsApi from '@/api/departments'
import { ApiError } from '@/api/client'

const { t } = useI18n()
const { data: departments, loading, error, reload } = useAsyncData(() => departmentsApi.list())
const name = ref('')
const creating = ref(false)
const createError = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const savingId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const actionErrorId = ref<string | null>(null)
const actionError = ref('')

async function createDepartment() {
  if (creating.value || !name.value.trim()) return
  creating.value = true
  createError.value = ''
  try {
    await departmentsApi.create(name.value)
    name.value = ''
    await reload()
  } catch (err) {
    createError.value = err instanceof ApiError && err.status === 409
      ? t('departments.duplicate')
      : t('departments.createFailed')
  } finally {
    creating.value = false
  }
}

function startEdit(department: departmentsApi.DepartmentWithCode) {
  editingId.value = department.id
  editName.value = department.name
  confirmingDeleteId.value = null
  actionErrorId.value = null
}

async function saveEdit(id: string) {
  if (savingId.value || !editName.value.trim()) return
  savingId.value = id
  actionErrorId.value = null
  try {
    await departmentsApi.update(id, editName.value)
    editingId.value = null
    await reload()
  } catch (err) {
    actionErrorId.value = id
    actionError.value = err instanceof ApiError && err.status === 409
      ? t('departments.duplicate')
      : t('departments.updateFailed')
  } finally {
    savingId.value = null
  }
}

async function deleteDepartment(id: string) {
  if (deletingId.value) return
  deletingId.value = id
  actionErrorId.value = null
  try {
    await departmentsApi.remove(id)
    confirmingDeleteId.value = null
    await reload()
  } catch (err) {
    actionErrorId.value = id
    actionError.value = err instanceof ApiError && err.status === 409
      ? t('departments.inUse')
      : t('departments.deleteFailed')
  } finally {
    deletingId.value = null
  }
}
</script>

<template>
  <HrLayout :breadcrumb="t('departments.title')">
    <section class="panel departments-panel">
      <div class="heading">
        <Building2 :size="26" aria-hidden="true" />
        <div>
          <h1>{{ t('departments.title') }}</h1>
          <p>{{ t('departments.hint') }}</p>
        </div>
      </div>

      <form class="create-form" @submit.prevent="createDepartment">
        <label for="department-name">{{ t('departments.name') }}</label>
        <div class="create-row">
          <Input id="department-name" v-model="name" minlength="2" maxlength="100" required />
          <Button type="submit" :disabled="creating || !name.trim()">
            <Plus :size="16" aria-hidden="true" />
            {{ creating ? t('departments.creating') : t('departments.create') }}
          </Button>
        </div>
      </form>
      <Alert v-if="createError" variant="destructive"><AlertDescription>{{ createError }}</AlertDescription></Alert>

      <p v-if="loading && !departments">{{ t('common.loading') }}</p>
      <Alert v-else-if="error" variant="destructive"><AlertDescription>{{ t('common.loadError') }}</AlertDescription></Alert>
      <p v-else-if="!departments?.length" class="empty">{{ t('departments.empty') }}</p>
      <div v-else class="department-list">
        <div v-for="department in departments" :key="department.id" class="department-row">
          <form v-if="editingId === department.id" class="department-edit" @submit.prevent="saveEdit(department.id)">
            <label :for="`department-edit-${department.id}`">{{ t('departments.name') }}</label>
            <Input :id="`department-edit-${department.id}`" v-model="editName" minlength="2" maxlength="100" required />
            <div class="row-actions">
              <Button type="submit" size="sm" :disabled="savingId === department.id || !editName.trim()">
                {{ savingId === department.id ? t('departments.saving') : t('departments.save') }}
              </Button>
              <Button type="button" variant="secondary" size="sm" :disabled="savingId === department.id" @click="editingId = null">
                {{ t('departments.cancel') }}
              </Button>
            </div>
          </form>
          <template v-else>
            <div class="department-main">
              <strong>{{ department.name }}</strong>
              <div class="row-actions">
                <Button type="button" variant="secondary" size="sm" @click="startEdit(department)">
                  <Pencil :size="14" aria-hidden="true" />{{ t('departments.edit') }}
                </Button>
                <Button type="button" variant="destructive" size="sm" :disabled="deletingId === department.id" @click="confirmingDeleteId = department.id; actionErrorId = null">
                  <Trash2 :size="14" aria-hidden="true" />{{ t('departments.delete') }}
                </Button>
              </div>
            </div>
            <div v-if="confirmingDeleteId === department.id" class="delete-confirm">
              <p>{{ t('departments.deleteConfirm', { name: department.name }) }}</p>
              <div class="row-actions">
                <Button type="button" variant="destructive" size="sm" :disabled="deletingId === department.id" @click="deleteDepartment(department.id)">
                  {{ deletingId === department.id ? t('departments.deleting') : t('departments.confirmDelete') }}
                </Button>
                <Button type="button" variant="secondary" size="sm" :disabled="deletingId === department.id" @click="confirmingDeleteId = null">
                  {{ t('departments.cancel') }}
                </Button>
              </div>
            </div>
          </template>
          <Alert v-if="actionErrorId === department.id" variant="destructive"><AlertDescription>{{ actionError }}</AlertDescription></Alert>
        </div>
      </div>
    </section>
  </HrLayout>
</template>

<style scoped>
.departments-panel { padding: var(--space-5); display: grid; gap: var(--space-5); }
.heading { display: flex; gap: var(--space-3); align-items: flex-start; }
h1 { font-size: 1.5rem; font-weight: 700; }
.heading p, .empty { color: var(--color-text-muted); }
.create-form { display: grid; gap: var(--space-2); max-width: 600px; }
.create-form label { font-weight: 600; }
.create-row { display: flex; gap: var(--space-2); align-items: center; }
.create-row :first-child { flex: 1; }
.department-list { display: grid; gap: var(--space-2); }
.department-row { display: grid; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.department-main { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); }
.department-edit { display: grid; gap: var(--space-2); }
.department-edit label { font-weight: 600; }
.row-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.delete-confirm { display: grid; gap: var(--space-2); }
.delete-confirm p { margin: 0; color: var(--color-danger); font-size: var(--font-size-sm); }
@media (max-width: 620px) { .department-row { align-items: flex-start; flex-direction: column; } }
</style>
