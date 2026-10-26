<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Pencil, Plus, Trash2 } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'
import * as summariesApi from '@/api/summaries'
import * as periodsApi from '@/api/periods'
import type { PublishedSummary, SummaryStatus } from '@/api/feed'
import type { Locale } from '@/types/common'

const MAX_TITLE = 200
const MAX_BODY = 5000

const { t, locale } = useI18n()
const { toast } = useToast()

const { data: summaries, loading, error, reload } = useAsyncData(() => summariesApi.list())
const { data: periods } = useAsyncData(() => periodsApi.list())

const periodLabel = (id: string) => {
  const p = periods.value?.find((item) => item.id === id)
  return p ? `${p.year}-${String(p.month).padStart(2, '0')}` : ''
}

// --- editor ---
const editingId = ref<string | null>(null)
const editorOpen = ref(false)
const form = reactive({ periodId: '', titleTh: '', titleEn: '', bodyTh: '', bodyEn: '' })
const saving = ref(false)
const formError = ref('')

function openNew() {
  editingId.value = null
  Object.assign(form, { periodId: periods.value?.[0]?.id ?? '', titleTh: '', titleEn: '', bodyTh: '', bodyEn: '' })
  formError.value = ''
  editorOpen.value = true
}

function openEdit(s: PublishedSummary) {
  editingId.value = s.id
  Object.assign(form, { periodId: s.periodId, titleTh: s.title.th, titleEn: s.title.en, bodyTh: s.body.th, bodyEn: s.body.en })
  formError.value = ''
  editorOpen.value = true
}

const canSave = computed(() => form.titleTh.trim() !== '' && form.bodyTh.trim() !== '' && !saving.value)

async function save(status: SummaryStatus) {
  if (!canSave.value) return
  saving.value = true
  formError.value = ''
  const payload = {
    periodId: form.periodId || undefined,
    title: { th: form.titleTh.trim(), en: form.titleEn.trim() },
    body: { th: form.bodyTh.trim(), en: form.bodyEn.trim() },
    status,
  }
  try {
    if (editingId.value) await summariesApi.update(editingId.value, payload)
    else await summariesApi.create(payload)
    toast.success(status === 'published' ? t('summaries.publishedToast') : t('summaries.draftSaved'))
    editorOpen.value = false
    await reload()
  } catch (e) {
    formError.value = e instanceof Error ? e.message : String(e)
  } finally {
    saving.value = false
  }
}

// --- list actions ---
const busyId = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

async function setStatus(s: PublishedSummary, status: SummaryStatus) {
  if (busyId.value) return
  busyId.value = s.id
  try {
    await summariesApi.update(s.id, { periodId: s.periodId || undefined, title: s.title, body: s.body, status })
    toast.success(status === 'published' ? t('summaries.publishedToast') : t('summaries.unpublishedToast'))
    await reload()
  } catch (e) {
    toast.error(t('summaries.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    busyId.value = null
  }
}

async function remove(s: PublishedSummary) {
  if (confirmDeleteId.value !== s.id) {
    confirmDeleteId.value = s.id
    return
  }
  busyId.value = s.id
  try {
    await summariesApi.remove(s.id)
    toast.success(t('summaries.deleted'))
    confirmDeleteId.value = null
    await reload()
  } catch (e) {
    toast.error(t('summaries.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    busyId.value = null
  }
}
</script>

<template>
  <HrLayout :breadcrumb="t('nav.summaries')">
    <div class="summaries">
      <section class="panel">
        <div class="header">
          <div>
            <h2>{{ t('summaries.title') }}</h2>
            <p class="hint">{{ t('summaries.hint') }}</p>
          </div>
          <Button v-if="!editorOpen" size="sm" @click="openNew">
            <Plus :size="15" aria-hidden="true" />
            {{ t('summaries.new') }}
          </Button>
        </div>

        <form v-if="editorOpen" class="editor" @submit.prevent="save('published')">
          <label>
            {{ t('summaries.period') }}
            <select v-model="form.periodId">
              <option value="">{{ t('summaries.noPeriod') }}</option>
              <option v-for="p in periods ?? []" :key="p.id" :value="p.id">{{ periodLabel(p.id) }}</option>
            </select>
          </label>
          <label>
            {{ t('summaries.titleTh') }}
            <Input v-model="form.titleTh" :maxlength="MAX_TITLE" required />
          </label>
          <label>
            {{ t('summaries.bodyTh') }}
            <textarea v-model="form.bodyTh" rows="5" :maxlength="MAX_BODY" :placeholder="t('summaries.bodyPlaceholder')" required />
          </label>
          <details :open="!!form.titleEn || !!form.bodyEn">
            <summary>{{ t('summaries.englishOptional') }}</summary>
            <label>
              {{ t('summaries.titleEn') }}
              <Input v-model="form.titleEn" :maxlength="MAX_TITLE" />
            </label>
            <label>
              {{ t('summaries.bodyEn') }}
              <textarea v-model="form.bodyEn" rows="5" :maxlength="MAX_BODY" />
            </label>
          </details>
          <p class="hint">{{ t('summaries.privacyHint') }}</p>
          <p v-if="formError" class="error" role="alert">{{ formError }}</p>
          <div class="actions">
            <Button type="submit" size="sm" :disabled="!canSave">{{ t('summaries.publish') }}</Button>
            <Button type="button" size="sm" variant="secondary" :disabled="!canSave" @click="save('draft')">{{ t('summaries.saveDraft') }}</Button>
            <Button type="button" size="sm" variant="secondary" :disabled="saving" @click="editorOpen = false">{{ t('common.cancel') }}</Button>
          </div>
        </form>
      </section>

      <p v-if="loading && !summaries">{{ t('common.loading') }}</p>
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>
          {{ t('common.loadError') }}
          <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
        </AlertDescription>
      </Alert>
      <p v-else-if="(summaries ?? []).length === 0" class="panel hint">{{ t('summaries.empty') }}</p>

      <article v-for="s in summaries ?? []" :key="s.id" class="panel summary">
        <div class="summary-head">
          <span class="badge" :class="s.status">{{ s.status === 'published' ? t('summaries.statusPublished') : t('summaries.statusDraft') }}</span>
          <span v-if="s.periodId" class="meta">{{ t('summaries.periodLabel', { period: periodLabel(s.periodId) }) }}</span>
          <span v-if="s.publishedAt" class="meta">{{ s.publishedAt }}</span>
        </div>
        <h3>{{ s.title[locale as Locale] || s.title.th }}</h3>
        <p class="body">{{ s.body[locale as Locale] || s.body.th }}</p>
        <div class="actions">
          <Button v-if="s.status === 'draft'" size="sm" :disabled="busyId === s.id" @click="setStatus(s, 'published')">{{ t('summaries.publish') }}</Button>
          <Button v-else size="sm" variant="secondary" :disabled="busyId === s.id" @click="setStatus(s, 'draft')">{{ t('summaries.unpublish') }}</Button>
          <Button size="sm" variant="secondary" :disabled="busyId === s.id || editorOpen" @click="openEdit(s)">
            <Pencil :size="14" aria-hidden="true" />
            {{ t('common.edit') }}
          </Button>
          <Button size="sm" variant="secondary" :disabled="busyId === s.id" @click="remove(s)">
            <Trash2 :size="14" aria-hidden="true" />
            {{ confirmDeleteId === s.id ? t('summaries.confirmDelete') : t('common.delete') }}
          </Button>
        </div>
      </article>
    </div>
  </HrLayout>
</template>

<style scoped>
.summaries {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 820px;
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

h2 {
  margin: 0 0 var(--space-1);
  font-size: var(--font-size-md);
  font-weight: 600;
}

h3 {
  margin: 0;
  font-size: var(--font-size-md);
}

.hint,
.meta {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.meta {
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}

.editor {
  display: grid;
  gap: var(--space-3);
  margin-top: var(--space-4);
}

.editor label {
  display: grid;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.editor details {
  display: grid;
  gap: var(--space-3);
}

.editor summary {
  cursor: pointer;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.editor details label + label {
  margin-top: var(--space-3);
}

select,
textarea {
  width: 100%;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-weight: 400;
}

select {
  max-width: 260px;
}

textarea {
  resize: vertical;
}

.summary {
  display: grid;
  gap: var(--space-2);
}

.summary-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}

.badge {
  font-size: var(--font-size-xs);
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: 999px;
  background: var(--color-bg);
  color: var(--color-text-muted);
}

.badge.published {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}

.body {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
  font-size: var(--font-size-sm);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
