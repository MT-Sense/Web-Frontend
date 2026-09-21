<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Lock, Upload } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import PrivacySettingsPanel from '@/components/forms/PrivacySettingsPanel.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAsyncData } from '@/composables/useAsyncData'
import * as periodsApi from '@/api/periods'
import * as surveyApi from '@/api/survey'
import { ApiError } from '@/api/client'

const { t, locale } = useI18n()

const { data: periods, loading, error, reload } = useAsyncData(() => periodsApi.list())
const { data: catalog } = useAsyncData(() => surveyApi.catalog())

const creating = ref(false)
const closingId = ref<string | null>(null)
const selectedExtraQuestions = ref<string[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const importPeriodId = ref('')
const importFile = ref<File | null>(null)
const importPreview = ref<periodsApi.ImportPreview | null>(null)
const importError = ref('')
const importDetails = ref<string[]>([])
const importSuccess = ref('')
const previewing = ref(false)
const importing = ref(false)

function chooseImport(periodId: string) {
  importPeriodId.value = periodId
  importFile.value = null
  importPreview.value = null
  importError.value = ''
  importDetails.value = []
  importSuccess.value = ''
  fileInput.value?.click()
}

async function onImportFileSelected(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''
  if (!file) return
  importFile.value = file
  importPreview.value = null
  importSuccess.value = ''
  importError.value = ''
  importDetails.value = []
  if (!file.name.toLowerCase().endsWith('.xlsx') || file.size > 5 * 1024 * 1024) {
    importError.value = t('periods.import.invalidFile')
    return
  }
  previewing.value = true
  try {
    importPreview.value = await periodsApi.previewImport(importPeriodId.value, file)
  } catch (err) {
    importError.value = err instanceof Error ? err.message : t('periods.import.failed')
    importDetails.value = err instanceof ApiError ? err.details : []
  } finally {
    previewing.value = false
  }
}

async function confirmImport() {
  if (!importFile.value || !importPreview.value || importing.value) return
  importing.value = true
  importError.value = ''
  importDetails.value = []
  try {
    const result = await periodsApi.importWorkbook(importPeriodId.value, importFile.value)
    importSuccess.value = t('periods.import.success', { count: result.imported })
    importPreview.value = null
    importFile.value = null
    await reload()
  } catch (err) {
    importError.value = err instanceof Error ? err.message : t('periods.import.failed')
    importDetails.value = err instanceof ApiError ? err.details : []
  } finally {
    importing.value = false
  }
}

function toggleExtraQuestion(key: string, checked: boolean) {
  selectedExtraQuestions.value = checked
    ? [...selectedExtraQuestions.value, key]
    : selectedExtraQuestions.value.filter((k) => k !== key)
}

function nextMonthYear(): { month: number; year: number } {
  const latest = periods.value?.[0]
  const base = latest ? new Date(latest.year, latest.month - 1 + 1, 1) : new Date()
  return { month: base.getMonth() + 1, year: base.getFullYear() }
}

async function openNextRound() {
  if (creating.value) return
  creating.value = true
  try {
    await periodsApi.create({ ...nextMonthYear(), enabledExtraQuestions: selectedExtraQuestions.value })
    await reload()
  } finally {
    creating.value = false
  }
}

async function closePeriod(id: string) {
  if (closingId.value || !window.confirm(t('periods.closeConfirm'))) return
  closingId.value = id
  try {
    await periodsApi.close(id)
    await reload()
  } finally {
    closingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}

function importPeriodLabel() {
  const period = periods.value?.find((item) => item.id === importPeriodId.value)
  return period ? `${period.year}-${String(period.month).padStart(2, '0')}` : ''
}
</script>

<template>
  <HrLayout :breadcrumb="t('periods.title')">
    <div class="periods-view">
      <PrivacySettingsPanel />

      <div class="toolbar">
        <p class="subtitle">{{ t('periods.subtitle') }}</p>
        <Button :disabled="creating" @click="openNextRound">
          <Plus :size="16" aria-hidden="true" />
          {{ t('periods.openNext') }}
        </Button>
      </div>

      <div v-if="catalog && catalog.length > 0" class="panel extra-questions-panel">
        <h2>{{ t('periods.extraQuestions.title') }}</h2>
        <p class="hint">{{ t('periods.extraQuestions.hint') }}</p>
        <label v-for="q in catalog" :key="q.key" class="extra-question-row">
          <Checkbox
            :model-value="selectedExtraQuestions.includes(q.key)"
            @update:model-value="(v: boolean | 'indeterminate') => toggleExtraQuestion(q.key, v === true)"
          />
          <span>{{ locale === 'th' ? q.label.th : q.label.en }}</span>
        </label>
      </div>

      <p v-if="loading && !periods">{{ t('common.loading') }}</p>
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>
          {{ t('common.loadError') }}
          <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
        </AlertDescription>
      </Alert>

      <div v-else class="panel">
        <input
          ref="fileInput"
          class="visually-hidden"
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          :aria-label="t('periods.import.chooseFile')"
          @change="onImportFileSelected"
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('nav.periods') }}</TableHead>
              <TableHead>{{ t('periods.opensAt') }}</TableHead>
              <TableHead>{{ t('periods.closesAt') }}</TableHead>
              <TableHead>{{ t('periods.responses') }}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in periods" :key="p.id">
              <TableCell class="font-semibold">{{ p.year }}-{{ String(p.month).padStart(2, '0') }}</TableCell>
              <TableCell>{{ formatDate(p.opensAt) }}</TableCell>
              <TableCell>{{ formatDate(p.closesAt) }}</TableCell>
              <TableCell>{{ p.responseCount }}</TableCell>
              <TableCell class="status-cell">
                <Badge :variant="p.isOpen ? 'default' : 'secondary'">
                  {{ p.isOpen ? t('periods.open') : t('periods.closed') }}
                </Badge>
                <Button
                  v-if="p.isOpen"
                  variant="secondary"
                  size="sm"
                  :disabled="closingId === p.id"
                  @click="closePeriod(p.id)"
                >
                  <Lock :size="14" aria-hidden="true" />
                  {{ t('periods.close') }}
                </Button>
                <Button variant="secondary" size="sm" :disabled="previewing || importing" @click="chooseImport(p.id)">
                  <Upload :size="14" aria-hidden="true" />
                  {{ t('periods.import.chooseFile') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <div v-if="previewing || importFile || importSuccess" class="import-panel">
          <h2>{{ t('periods.import.title') }}</h2>
          <p class="hint">{{ t('periods.import.format') }}</p>
          <p class="hint">{{ t('periods.import.anonymousNote') }}</p>
          <p v-if="importFile">{{ importFile.name }} · {{ importPeriodLabel() }}</p>
          <p v-if="previewing">{{ t('periods.import.checking') }}</p>
          <Alert v-if="importError" variant="destructive">
            <AlertDescription>
              <ul v-if="importDetails.length > 1" class="import-errors">
                <li v-for="(detail, index) in importDetails" :key="`${index}-${detail}`">{{ detail }}</li>
              </ul>
              <span v-else>{{ importError }}</span>
            </AlertDescription>
          </Alert>
          <Alert v-if="importSuccess"><AlertDescription>{{ importSuccess }}</AlertDescription></Alert>
          <template v-if="importPreview">
            <p>{{ t('periods.import.ready', { count: importPreview.rowCount }) }}</p>
            <ul>
              <li v-for="department in importPreview.departments" :key="department.name">
                {{ department.name }}: {{ department.count }}
              </li>
            </ul>
            <p v-if="importPreview.alreadyImported" class="import-warning">{{ t('periods.import.alreadyImported') }}</p>
            <Button :disabled="importing || importPreview.alreadyImported" @click="confirmImport">
              {{ importing ? t('periods.import.importing') : t('periods.import.confirm') }}
            </Button>
          </template>
        </div>
      </div>
    </div>
  </HrLayout>
</template>

<style scoped>
.periods-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.extra-questions-panel h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-md);
  font-weight: 600;
}

.extra-questions-panel .hint {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.extra-question-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-2);
  cursor: pointer;
}

.status-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.import-panel { border-top: 1px solid var(--color-border); margin-top: var(--space-5); padding-top: var(--space-5); }
.import-panel h2 { margin: 0 0 var(--space-2); font-size: var(--font-size-md); font-weight: 600; }
.import-panel .hint { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.import-panel ul { margin: var(--space-2) 0 var(--space-4); padding-left: var(--space-5); }
.import-warning { color: var(--color-warning); font-weight: 600; }
.import-errors { margin: 0; padding-left: var(--space-5); }

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
