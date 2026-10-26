<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { CircleCheck, LoaderCircle, Pencil, Plus, RotateCcw, Trash2 } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import * as feedApi from '@/api/feed'
import * as dashboardApi from '@/api/dashboard'
import type { ActionItem } from '@/types/actionItem'
import type { Locale } from '@/types/common'

const props = defineProps<{
  /** Scope the list and new items to one topic (used inside the topic drilldown). */
  topicId?: string
}>()

const { t, locale } = useI18n()
const { toast } = useToast()
const auth = useAuthStore()

const { data: items, loading, error, reload } = useAsyncData(() => feedApi.actionItems())
const { data: topics } = useAsyncData(() => dashboardApi.topics())

const visible = computed(() =>
  (items.value ?? []).filter((item) => !props.topicId || item.topicId === props.topicId),
)

function label(item: ActionItem) {
  return item.topic[locale.value as Locale] || item.topic.th
}

/** HR can change anything; an executive only what they opened (enforced by the API too). */
function canEdit(item: ActionItem) {
  return auth.currentRole === 'admin' || item.createdByMe
}

// --- create ---
const showCreate = ref(false)
const draft = reactive({ topicId: '', assignee: '', targetDate: '' })
const saving = ref(false)

function openCreate() {
  draft.topicId = props.topicId ?? topics.value?.[0]?.id ?? ''
  draft.assignee = ''
  draft.targetDate = ''
  showCreate.value = true
}

async function create() {
  const topic = topics.value?.find((item) => item.id === draft.topicId)
  if (!topic || saving.value) return
  saving.value = true
  try {
    await feedApi.createActionItem({
      topic: topic.label,
      topicId: topic.id,
      assignee: draft.assignee.trim(),
      targetDate: draft.targetDate,
    })
    showCreate.value = false
    toast.success(t('actionItems.created'))
    await reload()
  } catch (e) {
    toast.error(t('actionItems.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    saving.value = false
  }
}

// --- edit / status / delete ---
const editingId = ref<string | null>(null)
const edit = reactive({ assignee: '', targetDate: '' })
const busyId = ref<string | null>(null)
const confirmDeleteId = ref<string | null>(null)

function startEdit(item: ActionItem) {
  editingId.value = item.id
  edit.assignee = item.assignee
  edit.targetDate = item.targetDate
}

async function run(item: ActionItem, action: () => Promise<unknown>, message: string) {
  if (busyId.value) return
  busyId.value = item.id
  try {
    await action()
    toast.success(message)
    editingId.value = null
    confirmDeleteId.value = null
    await reload()
  } catch (e) {
    toast.error(t('actionItems.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    busyId.value = null
  }
}

function saveEdit(item: ActionItem) {
  run(item, () => feedApi.updateActionItem(item.id, { assignee: edit.assignee.trim(), targetDate: edit.targetDate }), t('actionItems.saved'))
}

function toggleStatus(item: ActionItem) {
  const status = item.status === 'done' ? 'in_progress' : 'done'
  run(item, () => feedApi.updateActionItem(item.id, { status }), status === 'done' ? t('actionItems.markedDone') : t('actionItems.reopened'))
}

function remove(item: ActionItem) {
  if (confirmDeleteId.value !== item.id) {
    confirmDeleteId.value = item.id
    return
  }
  run(item, () => feedApi.deleteActionItem(item.id), t('actionItems.deleted'))
}
</script>

<template>
  <section class="panel action-manager">
    <div class="header">
      <div>
        <h2>{{ t('actionItems.title') }}</h2>
        <p class="hint">{{ t('actionItems.hint') }}</p>
      </div>
      <Button v-if="!showCreate" size="sm" @click="openCreate">
        <Plus :size="15" aria-hidden="true" />
        {{ t('actionItems.add') }}
      </Button>
    </div>

    <form v-if="showCreate" class="create-form" @submit.prevent="create">
      <label v-if="!topicId">
        {{ t('actionItems.topic') }}
        <select v-model="draft.topicId" required>
          <option v-for="topic in topics ?? []" :key="topic.id" :value="topic.id">
            {{ topic.label[locale as Locale] || topic.label.th }}
          </option>
        </select>
      </label>
      <label>
        {{ t('actionItems.assignee') }}
        <Input v-model="draft.assignee" maxlength="255" :placeholder="t('actionItems.assigneePlaceholder')" />
      </label>
      <label>
        {{ t('actionItems.targetDate') }}
        <Input v-model="draft.targetDate" type="date" />
      </label>
      <div class="actions">
        <Button type="submit" size="sm" :disabled="saving || !draft.topicId">{{ t('common.save') }}</Button>
        <Button type="button" size="sm" variant="secondary" :disabled="saving" @click="showCreate = false">{{ t('common.cancel') }}</Button>
      </div>
    </form>

    <p v-if="loading && !items" class="hint">{{ t('common.loading') }}</p>
    <p v-else-if="error" class="error">
      {{ t('common.loadError') }}
      <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
    </p>
    <p v-else-if="visible.length === 0" class="hint">{{ t('actionItems.empty') }}</p>

    <ul v-else class="items">
      <li v-for="item in visible" :key="item.id" :class="{ done: item.status === 'done' }">
        <CircleCheck v-if="item.status === 'done'" :size="18" class="icon done" aria-hidden="true" />
        <LoaderCircle v-else :size="18" class="icon in-progress" aria-hidden="true" />

        <div class="content">
          <strong>{{ label(item) }}</strong>
          <div v-if="editingId === item.id" class="edit-row">
            <Input v-model="edit.assignee" maxlength="255" :placeholder="t('actionItems.assignee')" />
            <Input v-model="edit.targetDate" type="date" />
            <Button size="sm" :disabled="busyId === item.id" @click="saveEdit(item)">{{ t('common.save') }}</Button>
            <Button size="sm" variant="secondary" @click="editingId = null">{{ t('common.cancel') }}</Button>
          </div>
          <p v-else class="meta">
            {{ t('actionItems.assignee') }}: {{ item.assignee || '—' }}
            <template v-if="item.targetDate"> · {{ t('actionItems.targetDate') }}: {{ item.targetDate }}</template>
            <template v-if="item.doneAt"> · {{ t('actionItems.doneOn', { date: item.doneAt }) }}</template>
            · {{ item.level === 'decision' ? t('actionItems.byExecutive') : t('actionItems.byHr') }}
          </p>
        </div>

        <div v-if="canEdit(item) && editingId !== item.id" class="actions">
          <Button size="sm" :variant="item.status === 'done' ? 'secondary' : 'default'" :disabled="busyId === item.id" @click="toggleStatus(item)">
            <RotateCcw v-if="item.status === 'done'" :size="14" aria-hidden="true" />
            <CircleCheck v-else :size="14" aria-hidden="true" />
            {{ item.status === 'done' ? t('actionItems.reopen') : t('actionItems.markDone') }}
          </Button>
          <Button size="sm" variant="secondary" :aria-label="t('common.edit')" :disabled="busyId === item.id" @click="startEdit(item)">
            <Pencil :size="14" aria-hidden="true" />
          </Button>
          <Button size="sm" variant="secondary" :disabled="busyId === item.id" @click="remove(item)">
            <Trash2 :size="14" aria-hidden="true" />
            <span v-if="confirmDeleteId === item.id">{{ t('actionItems.confirmDelete') }}</span>
          </Button>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.action-manager {
  display: grid;
  gap: var(--space-3);
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

.hint,
.error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.error {
  color: var(--color-danger);
}

.create-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.create-form label {
  display: grid;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  font-weight: 600;
  min-width: 180px;
}

select {
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 var(--space-2);
  font: inherit;
  font-weight: 400;
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-2);
}

.items li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  flex-wrap: wrap;
}

.items li.done strong {
  color: var(--color-text-muted);
}

.icon {
  flex: none;
  margin-top: 2px;
}

.icon.done {
  color: var(--color-positive);
}

.icon.in-progress {
  color: var(--color-neutral);
}

.content {
  flex: 1;
  min-width: 200px;
  display: grid;
  gap: var(--space-1);
}

.meta {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.edit-row,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}
</style>
