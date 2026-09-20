<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { BrainCircuit } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import * as modelTrainingApi from '@/api/modelTraining'
import type { TrainingReport } from '@/api/modelTraining'

const { t } = useI18n()
const selectedFile = ref<File | null>(null)
const training = ref(false)
const report = ref<TrainingReport | null>(null)
const error = ref('')

function chooseFile(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  report.value = null
  error.value = ''
}

async function trainModel() {
  if (!selectedFile.value || training.value) return
  if (!selectedFile.value.name.toLowerCase().endsWith('.xlsx')) {
    error.value = t('modelTraining.invalidFile')
    return
  }
  if (selectedFile.value.size > 10 * 1024 * 1024) {
    error.value = t('modelTraining.fileTooLarge')
    return
  }
  if (!window.confirm(t('modelTraining.confirm'))) return
  training.value = true
  error.value = ''
  report.value = null
  try {
    report.value = await modelTrainingApi.train(selectedFile.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('modelTraining.failed')
  } finally {
    training.value = false
  }
}
</script>

<template>
  <HrLayout :breadcrumb="t('modelTraining.title')">
    <section class="panel training-panel">
      <div class="heading">
        <BrainCircuit :size="28" aria-hidden="true" />
        <div>
          <h1>{{ t('modelTraining.title') }}</h1>
          <p>{{ t('modelTraining.description') }}</p>
        </div>
      </div>

      <label class="file-label" for="training-workbook">{{ t('modelTraining.fileLabel') }}</label>
      <input
        id="training-workbook"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        :disabled="training"
        @change="chooseFile"
      />
      <p class="hint">{{ t('modelTraining.fileHint') }}</p>

      <Button :disabled="!selectedFile || training" @click="trainModel">
        {{ training ? t('modelTraining.training') : t('modelTraining.submit') }}
      </Button>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <div v-if="report" class="result" role="status">
        <h2>{{ t('modelTraining.success') }}</h2>
        <p>{{ t('modelTraining.accuracy') }}: {{ (report.accuracy * 100).toFixed(2) }}%</p>
        <p>{{ t('modelTraining.macroF1') }}: {{ (report.macroF1 * 100).toFixed(2) }}%</p>
        <p>{{ t('modelTraining.rows', { train: report.trainingRows, test: report.testRows }) }}</p>
      </div>
    </section>
  </HrLayout>
</template>

<style scoped>
.training-panel {
  max-width: 680px;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-4);
}
.heading { display: flex; align-items: flex-start; gap: var(--space-3); }
h1 { font-size: 1.5rem; font-weight: 700; }
h2 { font-size: 1.1rem; font-weight: 600; }
.heading p, .hint { color: var(--color-text-muted); }
.file-label { font-weight: 600; }
input[type='file'] { max-width: 100%; }
.result { display: grid; gap: var(--space-2); }
</style>
