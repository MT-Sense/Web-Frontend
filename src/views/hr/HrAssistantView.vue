<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import HrLayout from '@/layouts/HrLayout.vue'
import RoutingBoard from '@/components/forms/RoutingBoard.vue'
import { Button } from '@/components/ui/button'
import * as automation from '@/api/automation'
import { list as listPeriods } from '@/api/periods'
import { departments } from '@/api/dashboard'
import { useToast } from '@/composables/useToast'
import type { SurveyPeriod } from '@/types/survey'
import type { Department } from '@/types/department'

const { t } = useI18n()
const { toast } = useToast()
const proposals = ref<automation.Proposal[]>([])
const periods = ref<SurveyPeriod[]>([])
const depts = ref<Department[]>([])
const periodId = ref('')
const departmentId = ref('')
const status = ref('all')
const page = ref(1)
const pageSize = ref(3)
const busy = ref(false)
const error = ref('')
const editing = ref('')
const edit = ref({ title: '', draft: '', action: 'local_task' })
const confirming = ref<{ id: string; action: string } | null>(null)
const note = ref('')
const historyId = ref('')
const history = ref<automation.ProposalEvent[]>([])
const visible = computed(() => proposals.value.filter(p =>
  !p.demo && (status.value === 'all' || p.status === status.value),
))
const totalPages = computed(() => (
  Math.max(1, Math.ceil(visible.value.length / pageSize.value))
))
const paginated = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return visible.value.slice(start, start + pageSize.value)
})
const rangeStart = computed(() => (
  visible.value.length ? (page.value - 1) * pageSize.value + 1 : 0
))
const rangeEnd = computed(() => (
  Math.min(page.value * pageSize.value, visible.value.length)
))
const statusLabels = computed<Record<string, string>>(() => ({
  pending: t('hrAssistant.status.pending'),
  approved: t('hrAssistant.status.approved'),
  rejected: t('hrAssistant.status.rejected'),
  executing: t('hrAssistant.status.executing'),
  needs_check: t('hrAssistant.status.needs_check'),
  executed: t('hrAssistant.status.executed'),
  in_progress: t('hrAssistant.status.in_progress'),
  completed: t('hrAssistant.status.completed'),
}))
const bookLabels = computed<Record<string, string>>(() => ({
  workload: t('hrAssistant.playbook.workload'),
  approvals: t('hrAssistant.playbook.approvals'),
  training: t('hrAssistant.playbook.training'),
  benefits: t('hrAssistant.playbook.benefits'),
}))

function periodLabel(id: string) {
  const period = periods.value.find(item => item.id === id)

  return period ? `${period.year}-${String(period.month).padStart(2, '0')}` : id
}

function departmentLabel(id: string) {
  return depts.value.find(department => department.id === id)?.name
    ?? t('hrAssistant.companyWide')
}

async function run(task: () => Promise<void>) {
  if (busy.value) return

  busy.value = true
  error.value = ''

  try {
    await task()
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    busy.value = false
  }
}

async function load() {
  await run(async () => {
    const [loadedPeriods, loadedDepartments, loadedProposals] = await Promise.all([
      listPeriods(),
      departments(),
      automation.list(),
    ])

    periods.value = loadedPeriods
    depts.value = loadedDepartments
    proposals.value = loadedProposals
    page.value = 1

    if (!periodId.value) {
      periodId.value = loadedPeriods[0]?.id ?? ''
    }
  })
}

async function generate() {
  await run(async () => {
    const result = await automation.generate(periodId.value, departmentId.value)
    const notices = (result.notices ?? []).join('\n')

    if (result.created > 0) {
      toast.success(result.message, notices, 7000)
    } else {
      toast.info(t('hrAssistant.noNewTitle'), [result.message, notices].filter(Boolean).join('\n'), 7000)
    }

    proposals.value = await automation.list()
    status.value = 'all'
    page.value = 1
  })
}

function startEdit(p: automation.Proposal) {
  editing.value = p.id
  edit.value = { title: p.title, draft: p.draft, action: p.action }
  confirming.value = null
}

function replace(p: automation.Proposal) {
  proposals.value = proposals.value.map(row => row.id === p.id ? p : row)
}

async function save(p: automation.Proposal) {
  await run(async () => {
    const updatedProposal = await automation.review(p, 'edit', edit.value)

    replace(updatedProposal)
    editing.value = ''
    toast.success(t('hrAssistant.draftSaved'), t('hrAssistant.checkDestination'))
  })
}

function confirm(p: automation.Proposal, action: string) {
  confirming.value = { id: p.id, action }
  note.value = ''
}

async function apply(p: automation.Proposal) {
  const action = confirming.value?.action

  if (!action) return

  await run(async () => {
    const updated = action === 'execute' ? await automation.execute(p)
      : action === 'complete' ? await automation.complete(p, note.value)
      : await automation.review(p, action)

    replace(updated)
    confirming.value = null
    toast.success(t('hrAssistant.updated'))
  })
}

async function showHistory(p: automation.Proposal) {
  if (historyId.value === p.id) {
    historyId.value = ''
    return
  }

  await run(async () => {
    history.value = await automation.events(p.id)
    historyId.value = p.id
  })
}

watch([status, pageSize], () => {
  page.value = 1
})

onMounted(load)
</script>

<template>
  <HrLayout :breadcrumb="t('hrAssistant.breadcrumb')">
    <header class="assistant-heading">
      <div><h1>{{ t('hrAssistant.title') }}</h1><p>{{ t('hrAssistant.flow') }}</p></div>
      <RouterLink to="/settings/hr-assistant">{{ t('hrAssistant.settingsLink') }}</RouterLink>
    </header>
    <RoutingBoard />
    <section class="panel controls">
      <div class="playbooks"><span v-for="(label, key) in bookLabels" :key="key">{{ label }}</span></div>
      <p>{{ t('hrAssistant.description') }}</p>
      <div class="toolbar analysis-toolbar">
        <label>
          {{ t('hrAssistant.period') }}
          <select v-model="periodId" :disabled="busy">
            <option
              v-for="p in periods"
              :key="p.id"
              :value="p.id"
            >
              {{ p.year }}-{{ String(p.month).padStart(2, '0') }}
            </option>
          </select>
        </label>

        <label>
          {{ t('hrAssistant.department') }}
          <select v-model="departmentId" :disabled="busy">
            <option value="">
              {{ t('hrAssistant.companyWide') }}
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

        <Button :disabled="busy || !periodId" @click="generate">
          {{ busy ? t('hrAssistant.working') : t('hrAssistant.analyze') }}
        </Button>
      </div>
      <small>{{ t('hrAssistant.privacyNote') }}</small>

      <div class="section-divider" />

      <p v-if="error" role="alert" class="error">
        {{ error }}
        <Button variant="link" :disabled="busy" @click="load">
          {{ t('hrAssistant.reload') }}
        </Button>
      </p>
    <div class="toolbar list-toolbar">
      <label>
        {{ t('hrAssistant.statusLabel') }}
        <select v-model="status">
          <option value="all">
            {{ t('hrAssistant.allStatuses') }}
          </option>
          <option
            v-for="(label, key) in statusLabels"
            :key="key"
            :value="key"
          >
            {{ label }}
          </option>
        </select>
      </label>

      <label>
        {{ t('hrAssistant.perPage') }}
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
        {{ t('hrAssistant.reload') }}
      </Button>

      <span v-if="visible.length" class="page-summary">
        {{ t('hrAssistant.showing', { start: rangeStart, end: rangeEnd, total: visible.length }) }}
      </span>
    </div>
    <p v-if="!visible.length && !busy" class="empty">{{ t('hrAssistant.empty') }}</p>
    <article v-for="p in paginated" :key="p.id" class="proposal">
      <div class="proposal-header"><span class="badge" :class="p.status">{{ statusLabels[p.status] }}</span><span>{{ bookLabels[p.playbook] }}</span><small>v{{ p.version }}</small></div>
      <h2>{{ p.title }}</h2>
      <p class="scope">{{ periodLabel(p.periodId) }} · {{ departmentLabel(p.departmentId) }}</p>
      <p>{{ p.rationale }}</p>
      <details><summary>{{ t('hrAssistant.evidence') }} ({{ p.evidence.length }})</summary><div v-for="e in p.evidence" :key="e.id" class="evidence"><strong>{{ e.source }}</strong><p>{{ e.text }}</p></div></details>
      <div v-if="p.missingData?.length" class="missing"><strong>{{ t('hrAssistant.missingData') }}</strong><ul><li v-for="(item, i) in p.missingData" :key="i">{{ item }}</li></ul></div>
      <form v-if="editing === p.id" class="edit-form" @submit.prevent="save(p)">
        <label>{{ t('hrAssistant.titleField') }}<input v-model="edit.title" required maxlength="200" :disabled="busy" /></label>
        <label>{{ t('hrAssistant.actionDetails') }}<textarea v-model="edit.draft" required rows="6" maxlength="3000" :disabled="busy" /></label>
        <label>{{ t('hrAssistant.destination') }}<select v-model="edit.action" :disabled="busy"><option value="local_task">{{ t('hrAssistant.localTask') }}</option><option value="jira_task">{{ t('hrAssistant.jiraTask') }}</option></select></label>
        <p v-if="edit.action === 'jira_task'" class="hint">{{ t('hrAssistant.jiraPrivacyHint') }}</p>
        <div class="toolbar"><Button type="submit" :disabled="busy">{{ t('hrAssistant.saveDraft') }}</Button><Button type="button" variant="secondary" :disabled="busy" @click="editing = ''">{{ t('hrAssistant.cancel') }}</Button></div>
      </form>
      <template v-else>
        <div class="draft"><strong>{{ t('hrAssistant.plannedAction') }}</strong><p>{{ p.draft }}</p></div>
        <p class="destination"><strong>{{ t('hrAssistant.destinationLabel') }}</strong> {{ p.action === 'local_task' ? t('hrAssistant.localTask') : `${p.targetSite} · ${p.targetProject} · ${t('hrAssistant.issueType')} ${p.targetIssueType}` }}</p>
        <div class="toolbar">
          <template v-if="p.status === 'pending'"><Button variant="secondary" :disabled="busy" @click="startEdit(p)">{{ t('hrAssistant.editDraft') }}</Button><Button :disabled="busy" @click="confirm(p, 'approve')">{{ t('hrAssistant.approve') }}</Button><Button variant="secondary" :disabled="busy" @click="confirm(p, 'reject')">{{ t('hrAssistant.reject') }}</Button></template>
          <template v-if="p.status === 'approved'"><Button :disabled="busy" @click="confirm(p, 'execute')">{{ p.action === 'jira_task' ? t('hrAssistant.jiraTask') : t('hrAssistant.startFollowup') }}</Button><Button variant="secondary" :disabled="busy" @click="confirm(p, 'withdraw')">{{ t('hrAssistant.withdraw') }}</Button></template>
          <Button v-if="p.status === 'in_progress'" :disabled="busy" @click="confirm(p, 'complete')">{{ t('hrAssistant.complete') }}</Button>
          <Button variant="secondary" :disabled="busy" @click="showHistory(p)">{{ t('hrAssistant.history') }}</Button>
        </div>
      </template>
      <div v-if="confirming?.id === p.id" class="confirmation" role="group" :aria-label="t('hrAssistant.confirmAction')">
        <p v-if="confirming.action === 'approve'">{{ p.action === 'jira_task'
          ? t('hrAssistant.approveJiraConfirm')
          : t('hrAssistant.approveLocalConfirm') }}</p>
        <p v-else-if="confirming.action === 'execute'">{{ p.action === 'jira_task' ? t('hrAssistant.executeJiraConfirm') : t('hrAssistant.executeLocalConfirm') }}</p>
        <p v-else-if="confirming.action === 'withdraw'">{{ t('hrAssistant.withdrawConfirm') }}</p>
        <p v-else-if="confirming.action === 'reject'">{{ t('hrAssistant.rejectConfirm') }}</p>
        <label v-if="confirming.action === 'complete'">{{ t('hrAssistant.outcome') }}<textarea v-model="note" rows="3" maxlength="500" /></label>
        <div class="toolbar"><Button :disabled="busy || (confirming.action === 'complete' && !note.trim())" @click="apply(p)">{{ t('hrAssistant.confirm') }}</Button><Button variant="secondary" :disabled="busy" @click="confirming = null">{{ t('hrAssistant.cancel') }}</Button></div>
      </div>
      <p v-if="p.resultNote" class="result">{{ p.resultNote }}</p>
      <p v-if="p.status === 'executing'" class="hint">{{ t('hrAssistant.executingCheck', { id: p.id }) }}</p>
      <a v-if="p.resultUrl" :href="p.resultUrl" target="_blank" rel="noopener noreferrer">{{ t('hrAssistant.openJira') }}</a>
      <div v-if="historyId === p.id" class="history"><details v-for="entry in history" :key="entry.id"><summary>{{ new Date(entry.createdAt).toLocaleString() }} · {{ entry.event }} · v{{ entry.version }}</summary><p>{{ t('hrAssistant.actor') }} {{ entry.actorId }}</p><strong>{{ entry.snapshot.title }}</strong><p>{{ entry.snapshot.draft }}</p><p>{{ entry.snapshot.action }} {{ entry.snapshot.targetProject }}</p></details></div>
    </article>
    <nav v-if="totalPages > 1" class="pagination" :aria-label="t('hrAssistant.paginationLabel')">
      <Button variant="secondary" :disabled="page === 1" @click="page--">{{ t('hrAssistant.previous') }}</Button>
      <span>{{ t('hrAssistant.pageOf', { page, total: totalPages }) }}</span>
      <Button variant="secondary" :disabled="page === totalPages" @click="page++">{{ t('hrAssistant.next') }}</Button>
    </nav>
    </section>
  </HrLayout>
</template>

<style scoped>
h1 {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}

h2 {
  margin: 0;
  font-size: var(--font-size-lg);
  font-weight: 600;
}

p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.assistant-heading {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
  align-items: flex-start;
}

.assistant-heading p,
small,
.scope,
.hint {
  color: var(--color-text-muted);
}

a {
  color: var(--color-primary);
}

.controls,
.proposal,
.edit-form {
  display: grid;
  gap: var(--space-4);
}

.controls {
  padding: var(--space-5);
}

.proposal {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.playbooks,
.toolbar,
.proposal-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  align-items: center;
}

.toolbar {
  align-items: end;
}

.analysis-toolbar {
  padding: var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
}

.list-toolbar {
  padding: 0;
}

.section-divider {
  height: 1px;
  background: var(--color-border);
  margin: var(--space-2) 0;
}

.page-summary {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  padding-bottom: var(--space-2);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-3);
}

.playbooks span,
.badge {
  background: var(--color-accent-100);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: var(--font-size-xs);
}

.playbooks span {
  color: var(--color-text);
  font-weight: 600;
}

.badge.approved,
.badge.completed,
.badge.executed {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}

.badge.needs_check {
  background: var(--color-neutral-bg);
  color: var(--color-warning);
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
  resize: vertical;
  width: 100%;
}

.draft,
.missing,
.confirmation,
.evidence {
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-bg);
}

.missing {
  border-left: 3px solid var(--color-warning);
}

.confirmation {
  display: grid;
  gap: var(--space-3);
  border: 1px solid var(--color-primary);
}

.evidence {
  margin-top: var(--space-2);
}

.evidence p {
  font-size: var(--font-size-sm);
}

summary {
  cursor: pointer;
}

.history {
  display: grid;
  gap: var(--space-3);
  font-size: var(--font-size-sm);
}

.error {
  color: var(--color-danger);
}

.result {
  color: var(--color-primary);
}

ul {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-4);
}

@media (max-width: 600px) {
  .toolbar {
    align-items: stretch;
  }

  .controls {
    padding: var(--space-4);
  }

  .proposal {
    padding: var(--space-3);
  }

  .analysis-toolbar {
    padding: var(--space-3);
  }

  .controls label {
    width: 100%;
  }
}
</style>
