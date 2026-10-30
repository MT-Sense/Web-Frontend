<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, RefreshCw, Settings } from '@lucide/vue'
import { departments } from '@/api/dashboard'
import type { Department } from '@/types/department'
import * as routing from '@/api/routing'
import * as automation from '@/api/automation'
import { useToast } from '@/composables/useToast'

const { t } = useI18n()
const { toast } = useToast()
const policy = ref<routing.Policy>({ version: 0, rules: [] })
const rows = ref<routing.Case[]>([])
const depts = ref<Department[]>([])
const proposals = ref<automation.Proposal[]>([])
const busy = ref(false),
  error = ref('')
const title = ref(''),
  summary = ref(''),
  source = ref(''),
  filter = ref('all')
const selected = ref(''),
  topic = ref(''),
  owner = ref(''),
  note = ref('')
const rulesOpen = ref(false)
const caseFormOpen = ref(false)
const expandedCaseId = ref('')
const labels = computed<Record<string, string>>(() => ({
  triage: t('routing.status.triage'),
  routed: t('routing.status.routed'),
  in_progress: t('routing.status.in_progress'),
  completed: t('routing.status.completed'),
}))
const actions = computed<Record<string, string>>(() => ({
  created: t('routing.action.created'),
  route: t('routing.action.route'),
  acknowledge: t('routing.action.acknowledge'),
  complete: t('routing.action.complete'),
  retriage: t('routing.action.retriage'),
}))
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

function department(id: string) {
  return (
    depts.value.find((d) => d.id === id)?.name ??
    (id ? t('routing.deletedDepartment') : t('routing.unassigned'))
  )
}

async function run(fn: () => Promise<void>) {
  if (busy.value) return

  busy.value = true
  error.value = ''

  try {
    await fn()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function load() {
  await run(async () => {
    const [p, c, d, a] = await Promise.all([
      routing.policy(),
      routing.casesPage(page.value, pageSize.value, filter.value),
      departments(),
      automation.list(),
    ])
    policy.value = { ...p, rules: p.rules ?? [] }
    setPage(c)
    depts.value = d
    proposals.value = a
    selected.value = ''
  })
}

function setPage(result: routing.CasePage) {
  rows.value = result.items
  total.value = result.total
  page.value = result.page
}

async function fetchPage() {
  setPage(await routing.casesPage(page.value, pageSize.value, filter.value))
}

async function loadPage() {
  await run(fetchPage)
}

function addRule() {
  policy.value.rules.push({ id: '', topic: '', keywords: [], departmentId: '', enabled: true })
}

async function saveRules() {
  await run(async () => {
    policy.value = await routing.savePolicy(policy.value)
    toast.success(t('routing.rulesSaved'), t('routing.rulesSavedDetail'))
  })
}

function copyProposal() {
  const p = proposals.value.find((p) => p.id === source.value)

  if (p) {
    title.value = p.title
    summary.value = p.draft
  }
}

async function create() {
  await run(async () => {
    const c = await routing.create(title.value, summary.value)

    caseFormOpen.value = false
    expandedCaseId.value = c.id
    title.value = ''
    summary.value = ''
    source.value = ''
    filter.value = 'all'
    page.value = 1
    await fetchPage()

    toast.success(t('routing.caseCreated'), t('routing.caseCreatedDetail'))
  })
}

function select(c: routing.Case) {
  selected.value = c.id
  topic.value = c.topic
  owner.value = c.departmentId
  note.value = ''
}

async function change(c: routing.Case, action: string) {
  await run(async () => {
    await routing.update(c, action, topic.value, owner.value, note.value)
    selected.value = ''
    await fetchPage()

    toast.success(t('routing.updated'), t('routing.updatedDetail'))
  })
}

watch(
  [filter, pageSize],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)

watch([page, pageSize, filter], () => {
  if (busy.value) return
  selected.value = ''
  expandedCaseId.value = ''
  void loadPage()
})

onMounted(load)
</script>

<template>
  <section class="panel routing">
    <header class="card-header">
      <h2 class="panel-title">
        {{ t('routing.title') }}
        <InfoTooltip :label="t('routing.title')" :text="t('routing.description')" />
      </h2>
      <div class="buttons">
        <Button
          variant="secondary"
          :disabled="busy"
          :aria-expanded="rulesOpen"
          aria-controls="routing-rules-editor"
          @click="rulesOpen = !rulesOpen"
        >
          <Settings :size="16" aria-hidden="true" />
          {{ t('hrAssistant.workspace.rules') }}
        </Button>
        <Button
          :disabled="busy"
          :aria-expanded="caseFormOpen"
          aria-controls="routing-create-case"
          @click="caseFormOpen = !caseFormOpen"
        >
          <Plus :size="16" aria-hidden="true" />
          {{ t('routing.openCase') }}
        </Button>
      </div>
    </header>

    <Alert v-if="error" variant="destructive"
      ><AlertDescription>{{ error }}</AlertDescription></Alert
    >

    <section v-if="rulesOpen" id="routing-rules-editor" class="workspace-form">
      <h3>
        {{ t('routing.rulesSummary', { count: policy.rules.length }) }}
        <InfoTooltip
          :label="t('routing.rulesSummary', { count: policy.rules.length })"
          :text="t('routing.rulesHelp')"
        />
      </h3>

      <fieldset class="routing-rules" :disabled="busy">
        <div v-for="(r, i) in policy.rules" :key="i" class="routing-rule">
          <label>
            {{ t('routing.topic') }}
            <input v-model="r.topic" maxlength="100" :placeholder="t('routing.topicPlaceholder')" />
          </label>

          <label>
            {{ t('routing.keywords') }}
            <input
              :value="r.keywords.join(', ')"
              @change="
                r.keywords = ($event.target as HTMLInputElement).value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean)
              "
            />
          </label>

          <label>
            {{ t('routing.ownerDepartment') }}
            <select v-model="r.departmentId">
              <option value="">
                {{ t('routing.selectDepartment') }}
              </option>
              <option v-for="d in depts" :key="d.id" :value="d.id">
                {{ d.name }}
              </option>
            </select>
          </label>

          <label class="enabled-field">
            <span>
              <input v-model="r.enabled" type="checkbox" />
              {{ t('routing.enabled') }}
            </span>
          </label>

          <Button type="button" variant="secondary" @click="policy.rules.splice(i, 1)">
            {{ t('routing.deleteRule') }}
          </Button>
        </div>
      </fieldset>

      <div class="buttons">
        <Button variant="secondary" :disabled="busy || policy.rules.length >= 50" @click="addRule">
          {{ t('routing.addRule') }}
        </Button>
        <Button :disabled="busy" @click="saveRules">
          {{ t('routing.saveRules') }}
        </Button>
      </div>
    </section>
    <section v-if="caseFormOpen" id="routing-create-case" class="workspace-form">
      <h3>
        {{ t('routing.openCase') }}
        <InfoTooltip :label="t('routing.openCase')" :text="t('routing.openCaseHelp')" />
      </h3>

      <form @submit.prevent="create">
        <fieldset :disabled="busy">
          <label>
            {{ t('routing.copyDraft') }}
            <select v-model="source" @change="copyProposal">
              <option value="">
                {{ t('routing.newCase') }}
              </option>
              <option v-for="p in proposals" :key="p.id" :value="p.id">
                {{ p.title }}
              </option>
            </select>
          </label>

          <label>
            {{ t('routing.caseTitle') }}
            <input
              v-model="title"
              required
              maxlength="200"
              :placeholder="t('routing.casePlaceholder')"
            />
          </label>

          <label>
            {{ t('routing.caseSummary') }}
            <textarea v-model="summary" required maxlength="3000" rows="3" />
          </label>

          <Button type="submit">
            {{ t('routing.createCase') }}
          </Button>
        </fieldset>
      </form>
    </section>

    <div class="list-toolbar">
      <label class="status-filter">
        <span class="visually-hidden">{{ t('routing.statusLabel') }}</span>
        <select v-model="filter" :disabled="busy">
          <option value="all">{{ t('routing.allLatest') }}</option>
          <option v-for="(label, key) in labels" :key="key" :value="key">{{ label }}</option>
        </select>
      </label>
      <Button variant="secondary" :disabled="busy" @click="loadPage">
        <RefreshCw :size="16" aria-hidden="true" />
        {{ t('routing.reload') }}
      </Button>
    </div>

    <LoadingSpinner v-if="busy && !rows.length" size="lg" />
    <template v-else>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{{ t('routing.caseTitle') }}</TableHead>
            <TableHead>{{ t('routing.topic') }}</TableHead>
            <TableHead>{{ t('routing.ownerDepartment') }}</TableHead>
            <TableHead>{{ t('routing.statusLabel') }}</TableHead>
            <TableHead
              ><span class="visually-hidden">{{
                t('hrAssistant.workspace.details')
              }}</span></TableHead
            >
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-for="c in rows" :key="c.id">
            <TableRow :class="{ 'expanded-row': expandedCaseId === c.id }">
              <TableCell class="case-name"
                ><strong>{{ c.title }}</strong></TableCell
              >
              <TableCell>{{ c.topic || t('routing.unassigned') }}</TableCell>
              <TableCell>{{ department(c.departmentId) }}</TableCell>
              <TableCell
                ><span class="badge" :class="c.status">{{ labels[c.status] }}</span></TableCell
              >
              <TableCell>
                <Button
                  variant="secondary"
                  size="sm"
                  :aria-expanded="expandedCaseId === c.id"
                  :aria-controls="`case-details-${c.id}`"
                  @click="expandedCaseId = expandedCaseId === c.id ? '' : c.id"
                >
                  {{
                    t(
                      expandedCaseId === c.id
                        ? 'hrAssistant.workspace.hideDetails'
                        : 'hrAssistant.workspace.details',
                    )
                  }}
                </Button>
              </TableCell>
            </TableRow>
            <TableRow v-if="expandedCaseId === c.id">
              <TableCell :colspan="5" class="detail-cell">
                <article :id="`case-details-${c.id}`" :aria-label="c.title">
                  <span class="badge">{{ labels[c.status] }}</span>
                  <h3>{{ c.title }}</h3>
                  <p>{{ c.summary }}</p>
                  <p>
                    {{ t('routing.topicValue', { topic: c.topic || t('routing.unassigned') }) }}
                    ·
                    {{
                      c.status === 'triage'
                        ? t('routing.recipientSuggested', {
                            department: department(c.departmentId),
                          })
                        : t('routing.recipient', { department: department(c.departmentId) })
                    }}
                  </p>
                  <small>{{ c.matchReason }}</small>

                  <Button
                    v-if="selected !== c.id && c.status !== 'completed'"
                    variant="secondary"
                    :disabled="busy"
                    @click="select(c)"
                  >
                    {{ t('routing.review') }}
                  </Button>

                  <fieldset v-if="selected === c.id" :disabled="busy">
                    <template v-if="c.status === 'triage'">
                      <label>
                        {{ t('routing.editableTopic') }}
                        <input v-model="topic" maxlength="100" />
                      </label>

                      <label>
                        {{ t('routing.responsibleDepartment') }}
                        <select v-model="owner">
                          <option value="">
                            {{ t('routing.selectDepartment') }}
                          </option>
                          <option v-for="d in depts" :key="d.id" :value="d.id">
                            {{ d.name }}
                          </option>
                        </select>
                      </label>

                      <p>{{ t('routing.confirmRouteHelp') }}</p>
                    </template>

                    <label>
                      {{ t('routing.coordinationNote') }}
                      <textarea
                        v-model="note"
                        maxlength="1000"
                        rows="2"
                        :placeholder="t('routing.notePlaceholder')"
                      />
                    </label>

                    <div class="buttons">
                      <Button
                        v-if="c.status === 'triage'"
                        :disabled="!topic.trim() || !owner || !note.trim()"
                        @click="change(c, 'route')"
                      >
                        {{ t('routing.confirmRoute') }}
                      </Button>

                      <Button
                        v-if="c.status === 'routed'"
                        :disabled="!note.trim()"
                        @click="change(c, 'acknowledge')"
                      >
                        {{ t('routing.acknowledge') }}
                      </Button>

                      <Button
                        v-if="c.status === 'in_progress'"
                        :disabled="!note.trim()"
                        @click="change(c, 'complete')"
                      >
                        {{ t('routing.complete') }}
                      </Button>

                      <Button
                        v-if="['routed', 'in_progress'].includes(c.status)"
                        variant="secondary"
                        :disabled="!note.trim()"
                        @click="change(c, 'retriage')"
                      >
                        {{ t('routing.retriage') }}
                      </Button>

                      <Button variant="secondary" @click="selected = ''">
                        {{ t('routing.cancel') }}
                      </Button>
                    </div>
                  </fieldset>

                  <details>
                    <summary>{{ t('routing.history', { count: c.history.length }) }}</summary>

                    <div v-for="(e, i) in c.history" :key="i" class="history">
                      <strong>
                        {{ actions[e.action] }} · {{ new Date(e.at).toLocaleString() }}
                      </strong>
                      <p>{{ e.note }}</p>
                      <small>
                        {{
                          t('routing.historyMeta', {
                            topic: e.topic || t('routing.unspecifiedTopic'),
                            department: department(e.departmentId),
                            actor: e.actor,
                          })
                        }}
                      </small>
                    </div>
                  </details>
                </article>
              </TableCell>
            </TableRow>
          </template>
          <TableRow v-if="!rows.length && !error">
            <TableCell :colspan="5" class="empty">{{
              filter !== 'all' ? t('routing.noFiltered') : t('routing.empty')
            }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <TablePagination
        :page="page"
        v-model:page-size="pageSize"
        :total="total"
        :disabled="busy"
        @update:page="page = $event"
      />
    </template>
  </section>
</template>

<style scoped>
.routing,
fieldset,
form,
article {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
}
.card-header .panel-title {
  margin: 0;
}
h3 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}
p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}
small {
  color: var(--color-text-muted);
}
.workspace-form {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
fieldset {
  border: 0;
  padding: 0;
}
label {
  display: grid;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  min-width: 0;
}
input,
select,
textarea {
  min-width: 0;
  max-width: 100%;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  border-radius: var(--radius-md);
  padding: var(--space-2);
  font: inherit;
}
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
textarea {
  width: 100%;
  resize: vertical;
}
.routing-rules {
  gap: var(--space-3);
  margin: var(--space-3) 0;
}
.routing-rule {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.5fr) minmax(0, 1fr) auto auto;
  gap: var(--space-3);
  align-items: end;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  min-width: 0;
}
.routing-rule > * {
  min-width: 0;
}
.enabled-field {
  white-space: nowrap;
}
.enabled-field span {
  display: flex;
  gap: var(--space-2);
  align-items: center;
}
.enabled-field input {
  width: auto;
}
.buttons,
.list-toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: end;
}
.list-toolbar {
  justify-content: space-between;
}
.status-filter {
  max-width: 100%;
}
.case-name {
  min-width: 22ch;
  max-width: 40ch;
  white-space: normal;
  overflow-wrap: anywhere;
}
.badge {
  display: inline-block;
  width: fit-content;
  background: var(--color-accent-100);
  color: var(--color-primary);
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  white-space: nowrap;
}
.badge.completed {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}
.badge.in_progress {
  background: var(--color-neutral-bg);
  color: var(--color-warning);
}
.expanded-row {
  background: var(--color-primary-bg);
}
.detail-cell {
  padding: var(--space-4);
  white-space: normal;
}
article {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
article details {
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-3);
}
summary {
  cursor: pointer;
  font-weight: 600;
}
details[open] > summary {
  margin-bottom: var(--space-3);
}
.history {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}
.empty {
  padding: var(--space-6);
  text-align: center;
  color: var(--color-text-muted);
  white-space: normal;
}
@media (max-width: 1100px) {
  .routing-rule {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 640px) {
  .routing-rule {
    grid-template-columns: 1fr;
  }
  .card-header,
  .card-header .buttons {
    align-items: stretch;
  }
  .card-header .buttons,
  .card-header .buttons > button {
    width: 100%;
  }
  .workspace-form {
    padding: var(--space-3);
  }
}
</style>
