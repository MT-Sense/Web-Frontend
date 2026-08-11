<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import HrLayout from '@/layouts/HrLayout.vue'
import PrivacySettingsPanel from '@/components/forms/PrivacySettingsPanel.vue'
import QuestionTypePalette from '@/components/forms/QuestionTypePalette.vue'
import StepTabs from '@/components/forms/StepTabs.vue'
import QuestionCard from '@/components/forms/QuestionCard.vue'
import { surveys } from '@/mocks/surveys'
import type { QuestionType, Survey, SurveyQuestion, SurveyStep } from '@/types/survey'

const props = defineProps<{ id: string }>()
const { t } = useI18n()

const original = surveys[props.id]
const draft = reactive<Survey>(
  original
    ? JSON.parse(JSON.stringify(original))
    : {
        id: props.id,
        title: { th: 'แบบสอบถามใหม่', en: 'New survey' },
        cadence: 'monthly',
        nextRoundDate: '',
        steps: [{ id: 'step-1', title: { th: 'Step 1', en: 'Step 1' }, estimatedMinutes: 3, questions: [] }],
      },
)

const currentStepIndex = ref(0)
const currentStep = () => draft.steps[currentStepIndex.value] as SurveyStep

function addStep() {
  draft.steps.push({
    id: `step-${draft.steps.length + 1}`,
    title: { th: `Step ${draft.steps.length + 1}`, en: `Step ${draft.steps.length + 1}` },
    estimatedMinutes: 3,
    questions: [],
  })
  currentStepIndex.value = draft.steps.length - 1
}

function addQuestion(type: QuestionType) {
  const q: SurveyQuestion = {
    id: `q-${Date.now()}`,
    type,
    text: { th: 'คำถามใหม่', en: 'New question' },
    required: false,
  }
  if (type === 'singleChoice' || type === 'multiChoice') {
    q.options = [{ th: 'ตัวเลือก 1', en: 'Option 1' }]
  }
  currentStep().questions.push(q)
}

function updateQuestion(index: number, q: SurveyQuestion) {
  currentStep().questions.splice(index, 1, q)
}

function removeQuestion(index: number) {
  currentStep().questions.splice(index, 1)
}

function moveQuestion(index: number, direction: -1 | 1) {
  const list = currentStep().questions
  const target = index + direction
  if (target < 0 || target >= list.length) return
  const [item] = list.splice(index, 1)
  if (item) list.splice(target, 0, item)
}

const cadenceOptions = ['monthly', 'quarterly']
const showPreview = ref(false)
const published = ref(false)

function publish() {
  published.value = true
}
</script>

<template>
  <HrLayout :breadcrumb="t('nav.forms')">
    <PrivacySettingsPanel />

    <div class="builder-toolbar">
      <label class="cadence">
        {{ t('formBuilder.cadence') }}:
        <select v-model="draft.cadence">
          <option v-for="c in cadenceOptions" :key="c" :value="c">{{ c }}</option>
        </select>
      </label>
      <div class="actions">
        <button type="button" class="btn" @click="showPreview = !showPreview">
          {{ t('common.preview') }}
        </button>
        <button type="button" class="btn primary" @click="publish">{{ t('formBuilder.publish') }}</button>
      </div>
    </div>
    <p v-if="published" class="published-note">✓ Published + notified all employees</p>

    <StepTabs v-model="currentStepIndex" :steps="draft.steps" @add-step="addStep" />

    <div class="builder-body">
      <QuestionTypePalette @add="addQuestion" />
      <div class="canvas">
        <QuestionCard
          v-for="(question, i) in currentStep().questions"
          :key="question.id"
          :question="question"
          :is-first="i === 0"
          :is-last="i === currentStep().questions.length - 1"
          @update:question="(q) => updateQuestion(i, q)"
          @remove="removeQuestion(i)"
          @move-up="moveQuestion(i, -1)"
          @move-down="moveQuestion(i, 1)"
        />
        <p v-if="currentStep().questions.length === 0" class="empty">
          Add a question from the palette on the left.
        </p>
      </div>
    </div>

    <div v-if="showPreview" class="preview-panel">
      <h3>{{ t('common.preview') }}</h3>
      <div v-for="step in draft.steps" :key="step.id" class="preview-step">
        <h4>{{ step.title.th }}</h4>
        <ol>
          <li v-for="q in step.questions" :key="q.id">{{ q.text.th }} ({{ q.type }})</li>
        </ol>
      </div>
    </div>
  </HrLayout>
</template>

<style scoped>
.builder-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cadence select {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-2);
  margin-left: var(--space-2);
}

.actions {
  display: flex;
  gap: var(--space-2);
}

.btn {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-4);
  font-weight: 600;
  cursor: pointer;
}

.btn.primary {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: white;
}

.published-note {
  color: var(--color-positive);
  font-weight: 600;
}

.builder-body {
  display: flex;
  gap: var(--space-4);
  align-items: flex-start;
}

.canvas {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.empty {
  color: var(--color-text-subtle);
  font-size: var(--font-size-sm);
  text-align: center;
  padding: var(--space-6);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
}

.preview-panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.preview-step h4 {
  margin: var(--space-3) 0 var(--space-1);
}
</style>
