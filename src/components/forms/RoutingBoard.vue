<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
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
const busy = ref(false), error = ref('')
const title = ref(''), summary = ref(''), source = ref(''), filter = ref('all')
const selected = ref(''), topic = ref(''), owner = ref(''), note = ref('')
const page = ref(1), pageSize = ref(3)
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
const filteredRows = computed(() => rows.value.filter(r => filter.value === 'all' || r.status === filter.value))
const totalPages = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize.value)))
const paginatedRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})
const rangeStart = computed(() => filteredRows.value.length ? (page.value - 1) * pageSize.value + 1 : 0)
const rangeEnd = computed(() => Math.min(page.value * pageSize.value, filteredRows.value.length))

function department(id: string) {
  return depts.value.find(d => d.id === id)?.name ?? (id ? t('routing.deletedDepartment') : t('routing.unassigned'))
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
    const [p, c, d, a] = await Promise.all([routing.policy(), routing.cases(), departments(), automation.list()])
    policy.value = { ...p, rules: p.rules ?? [] }
    rows.value = c
    depts.value = d
    proposals.value = a
    selected.value = ''
    page.value = 1
  })
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
  const p = proposals.value.find(p => p.id === source.value)

  if (p) {
    title.value = p.title
    summary.value = p.draft
  }
}

async function create() {
  await run(async () => {
    const c = await routing.create(title.value, summary.value)

    rows.value.unshift(c)
    title.value = ''
    summary.value = ''
    source.value = ''
    filter.value = 'all'
    page.value = 1

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
    const updated = await routing.update(c, action, topic.value, owner.value, note.value)

    rows.value = rows.value.map(r => r.id === c.id ? updated : r)
    selected.value = ''
    page.value = 1

    toast.success(t('routing.updated'), t('routing.updatedDetail'))
  })
}

watch([filter, pageSize], () => {
  page.value = 1
  selected.value = ''
})

onMounted(load)
</script>

<template>
  <section class="panel routing">
    <header>
      <h2>{{ t('routing.title') }}</h2>
      <p>{{ t('routing.description') }}</p>
    </header>

    <p v-if="error" role="alert" class="error">
      {{ error }}
    </p>

    <details>
      <summary>{{ t('routing.rulesSummary', { count: policy.rules.length }) }}</summary>
      <p>{{ t('routing.rulesHelp') }}</p>

      <fieldset class="routing-rules" :disabled="busy">
        <div
          v-for="(r, i) in policy.rules"
          :key="i"
          class="routing-rule"
        >
          <label>
            {{ t('routing.topic') }}
            <input
              v-model="r.topic"
              maxlength="100"
              :placeholder="t('routing.topicPlaceholder')"
            />
          </label>

          <label>
            {{ t('routing.keywords') }}
            <input
              :value="r.keywords.join(', ')"
              @change="r.keywords = ($event.target as HTMLInputElement).value.split(',').map(s => s.trim()).filter(Boolean)"
            />
          </label>

          <label>
            {{ t('routing.ownerDepartment') }}
            <select v-model="r.departmentId">
              <option value="">
                {{ t('routing.selectDepartment') }}
              </option>
              <option
                v-for="d in depts"
                :key="d.id"
                :value="d.id"
              >
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

          <Button
            type="button"
            variant="secondary"
            @click="policy.rules.splice(i, 1)"
          >
            {{ t('routing.deleteRule') }}
          </Button>
        </div>
      </fieldset>

      <div class="buttons">
        <Button
          variant="secondary"
          :disabled="busy || policy.rules.length >= 50"
          @click="addRule"
        >
          {{ t('routing.addRule') }}
        </Button>
        <Button :disabled="busy" @click="saveRules">
          {{ t('routing.saveRules') }}
        </Button>
      </div>
    </details>

    <details>
      <summary>{{ t('routing.openCase') }}</summary>
      <p>{{ t('routing.openCaseHelp') }}</p>

      <form @submit.prevent="create">
        <fieldset :disabled="busy">
          <label>
            {{ t('routing.copyDraft') }}
            <select v-model="source" @change="copyProposal">
              <option value="">
                {{ t('routing.newCase') }}
              </option>
              <option
                v-for="p in proposals"
                :key="p.id"
                :value="p.id"
              >
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
            <textarea
              v-model="summary"
              required
              maxlength="3000"
              rows="3"
            />
          </label>

          <Button type="submit">
            {{ t('routing.createCase') }}
          </Button>
        </fieldset>
      </form>
    </details>

    <div class="section-divider" />

    <div class="buttons">
      <label>
        {{ t('routing.statusLabel') }}
        <select v-model="filter">
          <option value="all">
            {{ t('routing.allLatest') }}
          </option>
          <option
            v-for="(v, k) in labels"
            :key="k"
            :value="k"
          >
            {{ v }}
          </option>
        </select>
      </label>

      <label>
        {{ t('routing.perPage') }}
        <select v-model.number="pageSize">
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
      </label>

      <Button
        variant="secondary"
        :disabled="busy"
        @click="load"
      >
        {{ t('routing.reload') }}
      </Button>

      <span v-if="filteredRows.length" class="page-summary">
        {{ t('routing.showing', { start: rangeStart, end: rangeEnd, total: filteredRows.length }) }}
      </span>
    </div>

    <p v-if="!filteredRows.length">
      {{ rows.length ? t('routing.noFiltered') : t('routing.empty') }}
    </p>

    <article
      v-for="c in paginatedRows"
      :key="c.id"
    >
      <span class="badge">{{ labels[c.status] }}</span>
      <h3>{{ c.title }}</h3>
      <p>{{ c.summary }}</p>
      <p>
        {{ t('routing.topicValue', { topic: c.topic || t('routing.unassigned') }) }}
        ·
        {{
          c.status === 'triage'
            ? t('routing.recipientSuggested', { department: department(c.departmentId) })
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

      <fieldset
        v-if="selected === c.id"
        :disabled="busy"
      >
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
              <option
                v-for="d in depts"
                :key="d.id"
                :value="d.id"
              >
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

          <Button
            variant="secondary"
            @click="selected = ''"
          >
            {{ t('routing.cancel') }}
          </Button>
        </div>
      </fieldset>

      <details>
        <summary>{{ t('routing.history', { count: c.history.length }) }}</summary>

        <div
          v-for="(e, i) in c.history"
          :key="i"
          class="history"
        >
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

    <nav
      v-if="totalPages > 1"
      class="pagination"
      :aria-label="t('routing.paginationLabel')"
    >
      <Button
        variant="secondary"
        :disabled="page === 1"
        @click="page--"
      >
        {{ t('routing.previous') }}
      </Button>
      <span>{{ t('routing.pageOf', { page, total: totalPages }) }}</span>
      <Button
        variant="secondary"
        :disabled="page === totalPages"
        @click="page++"
      >
        {{ t('routing.next') }}
      </Button>
    </nav>
  </section>
</template>

<style scoped>
.routing,
fieldset,
form,
article {
  display: grid;
  gap: var(--space-4);
}

.routing {
  padding: var(--space-5);
}

header {
  display: grid;
  gap: var(--space-2);
}

header h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 700;
}

h3 {
  margin: 0;
  font-size: var(--font-size-md);
  font-weight: 600;
}

.routing p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

header p,
small,
.page-summary {
  color: var(--color-text-muted);
}

details,
article {
  min-width: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
  background: var(--color-surface);
}

details {
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease;
}

details[open] {
  border-color: color-mix(in srgb, var(--color-primary) 22%, var(--color-border));
  box-shadow: var(--shadow-sm);
}

summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-text);
}

details[open] > summary {
  margin-bottom: var(--space-4);
}

fieldset {
  border: 0;
  padding: 0;
  min-width: 0;
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
  border-color: var(--color-primary);
}

textarea {
  width: 100%;
  resize: vertical;
}

.routing-rules {
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.routing-rule {
  display: grid;
  grid-template-columns:
    minmax(160px, 1fr)
    minmax(240px, 1.5fr)
    minmax(180px, 1fr)
    auto
    auto;
  gap: var(--space-3);
  align-items: end;
  padding: var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-bg);
  min-width: 0;
}

.routing-rule > * {
  min-width: 0;
}

.enabled-field {
  align-self: center;
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

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: end;
}

.page-summary {
  font-size: var(--font-size-sm);
  padding-bottom: var(--space-2);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
}

.badge {
  justify-self: start;
  background: var(--color-accent-100);
  color: var(--color-primary);
  padding: 4px 10px;
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.history {
  padding: var(--space-3) 0;
  border-bottom: 1px solid var(--color-border);
}

.error {
  color: var(--color-danger);
}

.section-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-2) 0;
}

@media (max-width: 1100px) {
  .routing-rule {
    grid-template-columns: 1fr 1fr;
  }

  .enabled-field {
    align-self: end;
  }
}

@media (max-width: 650px) {
  .routing {
    padding: var(--space-4);
  }

  .routing-rule {
    grid-template-columns: 1fr;
  }

  .buttons {
    align-items: stretch;
  }

  .buttons > button {
    width: 100%;
  }
}
</style>
