<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAsyncData } from '@/composables/useAsyncData'
import * as departmentsApi from '@/api/departments'
import { ApiError } from '@/api/client'

const { t, locale } = useI18n()
const page = ref(1)
const pageSize = ref(10)
const { data: departmentPage, loading, error, reload } = useAsyncData(() => departmentsApi.listPage(page.value, pageSize.value))
const departments = computed(() => departmentPage.value?.items ?? [])
const total = computed(() => departmentPage.value?.total ?? 0)
const currentPage = computed(() => departmentPage.value?.page ?? page.value)
const name = ref('')
const showCreateForm = ref(false)
const creating = ref(false)
const createError = ref('')
const editingId = ref<string | null>(null)
const editName = ref('')
const savingId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deletingId = ref<string | null>(null)
const actionErrorId = ref<string | null>(null)
const actionError = ref('')
const busy = computed(() => loading.value || creating.value || !!savingId.value || !!deletingId.value)

watch(pageSize, () => {
  page.value = 1
}, { flush: 'sync' })

watch([page, pageSize], () => {
  editingId.value = null
  confirmingDeleteId.value = null
  actionErrorId.value = null
  void reload()
})

async function createDepartment() {
  if (creating.value || !name.value.trim()) return
  creating.value = true
  createError.value = ''
  try {
    await departmentsApi.create(name.value)
    name.value = ''
    showCreateForm.value = false
    if (page.value === 1) {
      await reload()
    } else {
      page.value = 1
    }
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

function cancelCreate() {
  showCreateForm.value = false
  name.value = ''
  createError.value = ''
}

function formatCreatedAt(value: string | null | undefined) {
  if (!value) return t('departments.unknownDate')
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return t('departments.unknownDate')
  return new Intl.DateTimeFormat(locale.value === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium' }).format(date)
}
</script>

<template>
  <HrLayout :breadcrumb="t('departments.title')">
    <section class="panel departments-panel" aria-labelledby="departments-title">
      <header class="card-header">
        <h2 id="departments-title" class="panel-title">
          {{ t('departments.title') }}
          <InfoTooltip :label="t('departments.title')" :text="t('departments.hint')" />
        </h2>
        <Button
          type="button"
          :disabled="busy || error"
          :aria-expanded="showCreateForm"
          aria-controls="department-create-form"
          @click="showCreateForm = !showCreateForm"
        >
          <Plus :size="16" aria-hidden="true" />
          {{ t('departments.create') }}
        </Button>
      </header>

      <form v-if="showCreateForm" id="department-create-form" class="create-form" @submit.prevent="createDepartment">
        <label for="department-name">{{ t('departments.name') }}</label>
        <div class="create-row">
          <Input id="department-name" v-model="name" minlength="2" maxlength="100" required />
          <Button type="submit" :disabled="busy || !name.trim()">
            <Plus :size="16" aria-hidden="true" />
            {{ creating ? t('departments.creating') : t('departments.create') }}
          </Button>
          <Button type="button" variant="secondary" :disabled="creating" @click="cancelCreate">
            {{ t('departments.cancel') }}
          </Button>
        </div>
        <Alert v-if="createError" variant="destructive">
          <AlertDescription>{{ createError }}</AlertDescription>
        </Alert>
      </form>

      <LoadingSpinner v-if="loading" size="lg" />
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>
          {{ t('common.loadError') }}
          <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
        </AlertDescription>
      </Alert>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('departments.name') }}</TableHead>
            <TableHead>{{ t('departments.createdAt') }}</TableHead>
            <TableHead>{{ t('departments.actions') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="department in departments" :key="department.id">
            <TableRow>
              <TableCell class="department-name">
                <form
                  v-if="editingId === department.id"
                  :id="`department-edit-form-${department.id}`"
                  @submit.prevent="saveEdit(department.id)"
                >
                  <label class="visually-hidden" :for="`department-edit-${department.id}`">{{ t('departments.name') }}</label>
                  <Input :id="`department-edit-${department.id}`" v-model="editName" minlength="2" maxlength="100" required />
                </form>
                <strong v-else>{{ department.name }}</strong>
              </TableCell>
              <TableCell class="created-at">
                <time v-if="department.createdAt" :datetime="department.createdAt">{{ formatCreatedAt(department.createdAt) }}</time>
                <span v-else>{{ t('departments.unknownDate') }}</span>
              </TableCell>
              <TableCell>
                <div v-if="editingId === department.id" class="row-actions">
                  <Button type="submit" :form="`department-edit-form-${department.id}`" size="sm" :disabled="busy || !editName.trim()">
                    {{ savingId === department.id ? t('departments.saving') : t('departments.save') }}
                  </Button>
                  <Button type="button" variant="secondary" size="sm" :disabled="busy" @click="editingId = null">
                    {{ t('departments.cancel') }}
                  </Button>
                </div>
                <div v-else class="row-actions">
                  <Button type="button" variant="secondary" size="sm" :disabled="busy" @click="startEdit(department)">
                    <Pencil :size="14" aria-hidden="true" />
                    {{ t('departments.edit') }}
                  </Button>
                  <Button type="button" variant="destructive" size="sm" :disabled="busy" @click="confirmingDeleteId = department.id; actionErrorId = null">
                    <Trash2 :size="14" aria-hidden="true" />
                    {{ t('departments.delete') }}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="confirmingDeleteId === department.id || actionErrorId === department.id">
              <TableCell :colspan="3">
                <div v-if="confirmingDeleteId === department.id" class="delete-confirm">
                  <p>{{ t('departments.deleteConfirm', { name: department.name }) }}</p>
                  <div class="row-actions">
                    <Button type="button" variant="destructive" size="sm" :disabled="busy" @click="deleteDepartment(department.id)">
                      {{ deletingId === department.id ? t('departments.deleting') : t('departments.confirmDelete') }}
                    </Button>
                    <Button type="button" variant="secondary" size="sm" :disabled="busy" @click="confirmingDeleteId = null">
                      {{ t('departments.cancel') }}
                    </Button>
                  </div>
                </div>
                <Alert v-if="actionErrorId === department.id" variant="destructive">
                  <AlertDescription>{{ actionError }}</AlertDescription>
                </Alert>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!departments?.length">
            <TableCell :colspan="3" class="empty">{{ t('departments.empty') }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <TablePagination
        v-if="!loading && !error"
        :page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :disabled="busy"
        @update:page="page = $event"
      />
    </section>
  </HrLayout>
</template>

<style scoped>
.departments-panel { min-width: 0; }
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  margin-bottom: var(--space-4);
}
.card-header .panel-title { margin: 0; }
.create-form {
  display: grid;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border);
}
.create-form label { font-weight: 600; font-size: var(--font-size-sm); }
.create-row { display: flex; flex-wrap: wrap; gap: var(--space-2); align-items: center; }
.create-row :first-child { flex: 1; }
.department-name { min-width: 0; }
.created-at { white-space: nowrap; color: var(--color-text-muted); }
.row-actions { display: flex; flex-wrap: wrap; gap: var(--space-2); }
.delete-confirm { display: grid; gap: var(--space-2); margin-bottom: var(--space-3); }
.delete-confirm p { margin: 0; color: var(--color-danger); font-size: var(--font-size-sm); }
.empty { text-align: center; color: var(--color-text-muted); padding: var(--space-6); }
@media (max-width: 640px) {
  .card-header { flex-direction: column; align-items: stretch; }
  .create-row { flex-direction: column; align-items: stretch; }
}
</style>
