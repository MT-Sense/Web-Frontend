<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import HrLayout from '@/layouts/HrLayout.vue'
import RoutingBoard from '@/components/forms/RoutingBoard.vue'
import InfoTooltip from '@/components/common/InfoTooltip.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import LoadingSkeleton from '@/components/common/LoadingSkeleton.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { RefreshCw, Settings, Sparkles } from '@lucide/vue'
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
const activeTab = ref('proposals')
const expandedId = ref('')
const busy = ref(false)
const error = ref('')
const editing = ref('')
const edit = ref({ title: '', draft: '', action: 'local_task' })
const confirming = ref<{ id: string; action: string } | null>(null)
const note = ref('')
const historyId = ref('')
const history = ref<automation.ProposalEvent[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const counts = ref<automation.ProposalPage['stats'] | null>(null)
const summaryLoading = computed(() => !counts.value && !error.value)
const scopeLoading = ref(true)
const scopeReady = ref(false)
const scopeError = ref('')
const generating = ref(false)
const proposalStats = computed(() => [
  { label: t('hrAssistant.workspace.total'), value: counts.value?.total ?? '—' },
  { label: t('hrAssistant.workspace.pending'), value: counts.value?.pending ?? '—' },
  { label: t('hrAssistant.workspace.active'), value: counts.value?.active ?? '—' },
])
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
  const period = periods.value.find((item) => item.id === id)

  return period ? `${period.year}-${String(period.month).padStart(2, '0')}` : id
}

function departmentLabel(id: string) {
  return (
    depts.value.find((department) => department.id === id)?.name ?? t('hrAssistant.companyWide')
  )
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

async function loadScope() {
  scopeLoading.value = true
  scopeError.value = ''
  try {
    const [loadedPeriods, loadedDepartments] = await Promise.all([listPeriods(), departments()])
    periods.value = loadedPeriods
    depts.value = loadedDepartments
    if (!periodId.value) periodId.value = loadedPeriods[0]?.id ?? ''
    scopeReady.value = true
  } catch (e) {
    scopeError.value = e instanceof Error ? e.message : String(e)
  } finally {
    scopeLoading.value = false
  }
}

function setPage(result: automation.ProposalPage) {
  proposals.value = result.items
  total.value = result.total
  counts.value = result.stats
  page.value = result.page
}

async function fetchPage() {
  setPage(await automation.listPage(page.value, pageSize.value, status.value))
}

async function loadPage() {
  await run(fetchPage)
}

async function generate() {
  if (busy.value || !scopeReady.value) return
  generating.value = true
  try {
    await run(async () => {
      const result = await automation.generate(periodId.value, departmentId.value)
      const notices = (result.notices ?? []).join('\n')

      if (result.created > 0) {
        toast.success(result.message, notices, 7000)
      } else {
        toast.info(
          t('hrAssistant.noNewTitle'),
          [result.message, notices].filter(Boolean).join('\n'),
          7000,
        )
      }

      status.value = 'all'
      page.value = 1
      await fetchPage()
    })
  } finally {
    generating.value = false
  }
}

function startEdit(p: automation.Proposal) {
  editing.value = p.id
  edit.value = { title: p.title, draft: p.draft, action: p.action }
  confirming.value = null
}

function replace(p: automation.Proposal) {
  proposals.value = proposals.value.map((row) => (row.id === p.id ? p : row))
}

async function save(p: automation.Proposal) {
  await run(async () => {
    const updatedProposal = await automation.review(p, 'edit', edit.value)

    replace(updatedProposal)
    editing.value = ''
    await fetchPage()
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
    const updated =
      action === 'execute'
        ? await automation.execute(p)
        : action === 'complete'
          ? await automation.complete(p, note.value)
          : await automation.review(p, action)

    replace(updated)
    confirming.value = null
    await fetchPage()
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

watch(
  [status, pageSize],
  () => {
    page.value = 1
  },
  { flush: 'sync' },
)

watch([page, pageSize, status], () => {
  if (busy.value) return
  expandedId.value = ''
  editing.value = ''
  confirming.value = null
  historyId.value = ''
  void loadPage()
})

onMounted(() => {
  void loadScope()
  void loadPage()
})
</script>

<template>
  <HrLayout :breadcrumb="t('hrAssistant.breadcrumb')">
    <Tabs v-model="activeTab" class="assistant-workspace">
      <section class="workspace-header">
        <header class="card-header">
          <h2 class="panel-title">
            {{ t('hrAssistant.breadcrumb') }}
            <InfoTooltip :label="t('hrAssistant.breadcrumb')" :text="t('hrAssistant.flow')" />
          </h2>
          <Button variant="secondary" as-child>
            <RouterLink to="/settings/hr-assistant">
              <Settings :size="16" aria-hidden="true" />
              {{ t('hrAssistant.settingsLink') }}
            </RouterLink>
          </Button>
        </header>
        <TabsList class="workspace-tabs" :aria-label="t('hrAssistant.workspace.sections')">
          <TabsTrigger value="proposals">{{ t('hrAssistant.workspace.proposalsTab') }}</TabsTrigger>
          <TabsTrigger value="routing">{{ t('hrAssistant.workspace.routingTab') }}</TabsTrigger>
        </TabsList>
      </section>

      <TabsContent
        v-show="activeTab === 'proposals'"
        value="proposals"
        force-mount
        class="workspace-content"
      >
        <div class="summary-grid" :aria-busy="summaryLoading">
          <div v-for="stat in proposalStats" :key="stat.label" class="panel summary-card">
            <span>{{ stat.label }}</span>
            <strong>
              <LoadingSkeleton v-if="summaryLoading" variant="value" />
              <template v-else>{{ stat.value }}</template>
            </strong>
          </div>
          <span v-if="summaryLoading" class="visually-hidden" role="status">{{
            t('common.loading')
          }}</span>
        </div>

        <section class="panel analysis-panel">
          <header class="card-header">
            <h2 class="panel-title">
              {{ t('hrAssistant.workspace.prepare') }}
              <InfoTooltip
                :label="t('hrAssistant.workspace.prepare')"
                :text="[t('hrAssistant.description'), t('hrAssistant.privacyNote')].join('\n\n')"
              />
            </h2>
          </header>
          <Alert v-if="scopeError" variant="destructive" class="scope-error">
            <AlertDescription>{{ scopeError }}</AlertDescription>
            <Button variant="secondary" :disabled="scopeLoading" @click="loadScope">
              <RefreshCw :size="16" aria-hidden="true" />
              {{ t('hrAssistant.reload') }}
            </Button>
          </Alert>
          <div class="analysis-toolbar toolbar" :aria-busy="scopeLoading">
            <span v-if="scopeLoading" class="visually-hidden" role="status">{{
              t('common.loading')
            }}</span>
            <label>
              {{ t('hrAssistant.period') }}
              <LoadingSkeleton v-if="scopeLoading && !scopeReady" variant="control" />
              <select v-else v-model="periodId" :disabled="busy || !scopeReady">
                <option v-if="!scopeReady" value="">
                  {{ t('hrAssistant.workspace.scopeUnavailable') }}
                </option>
                <option v-else-if="!periods.length" value="">{{ t('periods.empty') }}</option>
                <option v-for="period in periods" :key="period.id" :value="period.id">
                  {{ period.year }}-{{ String(period.month).padStart(2, '0') }}
                </option>
              </select>
            </label>
            <label>
              {{ t('hrAssistant.department') }}
              <LoadingSkeleton v-if="scopeLoading && !scopeReady" variant="control" />
              <select v-else v-model="departmentId" :disabled="busy || !scopeReady">
                <option v-if="!scopeReady" value="">
                  {{ t('hrAssistant.workspace.scopeUnavailable') }}
                </option>
                <option v-else value="">{{ t('hrAssistant.companyWide') }}</option>
                <option v-for="department in depts" :key="department.id" :value="department.id">
                  {{ department.name }}
                </option>
              </select>
            </label>
            <Button :disabled="busy || scopeLoading || !scopeReady || !periodId" @click="generate">
              <LoadingSpinner v-if="generating" inline :label="t('hrAssistant.working')" />
              <template v-else>
                <Sparkles :size="16" aria-hidden="true" />
                {{ t('hrAssistant.analyze') }}
              </template>
            </Button>
          </div>
          <div class="playbooks">
            <span class="playbook-caption">{{ t('hrAssistant.workspace.playbooks') }}</span>
            <span v-for="(label, key) in bookLabels" :key="key" class="playbook-chip">{{
              label
            }}</span>
          </div>
        </section>

        <section class="panel proposal-list">
          <header class="card-header">
            <h2 class="panel-title">
              {{ t('hrAssistant.title') }}
              <InfoTooltip
                :label="t('hrAssistant.title')"
                :text="t('hrAssistant.workspace.listHelp')"
              />
            </h2>
            <div class="toolbar">
              <label class="status-filter">
                <span class="visually-hidden">{{ t('hrAssistant.statusLabel') }}</span>
                <select v-model="status" :disabled="busy">
                  <option value="all">{{ t('hrAssistant.allStatuses') }}</option>
                  <option v-for="(label, key) in statusLabels" :key="key" :value="key">
                    {{ label }}
                  </option>
                </select>
              </label>
              <Button variant="secondary" :disabled="busy" @click="loadPage">
                <RefreshCw :size="16" aria-hidden="true" />
                {{ t('hrAssistant.reload') }}
              </Button>
            </div>
          </header>

          <Alert v-if="error" variant="destructive" class="load-error"
            ><AlertDescription>{{ error }}</AlertDescription></Alert
          >
          <LoadingSpinner
            v-if="busy && !proposals.length"
            size="lg"
            :label="t('hrAssistant.working')"
          />
          <template v-else>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{{ t('hrAssistant.titleField') }}</TableHead>
                  <TableHead>{{ t('hrAssistant.workspace.playbookColumn') }}</TableHead>
                  <TableHead>{{ t('hrAssistant.workspace.scope') }}</TableHead>
                  <TableHead>{{ t('hrAssistant.statusLabel') }}</TableHead>
                  <TableHead>{{ t('hrAssistant.destination') }}</TableHead>
                  <TableHead
                    ><span class="visually-hidden">{{
                      t('hrAssistant.workspace.details')
                    }}</span></TableHead
                  >
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-for="p in proposals" :key="p.id">
                  <TableRow :class="{ 'expanded-row': expandedId === p.id }">
                    <TableCell class="proposal-name"
                      ><strong>{{ p.title }}</strong></TableCell
                    >
                    <TableCell>{{ bookLabels[p.playbook] }}</TableCell>
                    <TableCell>
                      <span class="cell-stack"
                        ><strong>{{ periodLabel(p.periodId) }}</strong
                        ><small>{{ departmentLabel(p.departmentId) }}</small></span
                      >
                    </TableCell>
                    <TableCell
                      ><span class="badge" :class="p.status">{{
                        statusLabels[p.status]
                      }}</span></TableCell
                    >
                    <TableCell>{{
                      p.action === 'jira_task'
                        ? t('hrAssistant.jiraTask')
                        : t('hrAssistant.localTask')
                    }}</TableCell>
                    <TableCell>
                      <Button
                        variant="secondary"
                        size="sm"
                        :aria-expanded="expandedId === p.id"
                        :aria-controls="`proposal-details-${p.id}`"
                        @click="expandedId = expandedId === p.id ? '' : p.id"
                      >
                        {{
                          t(
                            expandedId === p.id
                              ? 'hrAssistant.workspace.hideDetails'
                              : 'hrAssistant.workspace.details',
                          )
                        }}
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="expandedId === p.id">
                    <TableCell :colspan="6" class="detail-cell">
                      <article
                        :id="`proposal-details-${p.id}`"
                        class="proposal"
                        :aria-label="p.title"
                      >
                        <div class="proposal-header">
                          <span class="badge" :class="p.status">{{ statusLabels[p.status] }}</span
                          ><span>{{ bookLabels[p.playbook] }}</span
                          ><small>v{{ p.version }}</small>
                        </div>
                        <h3>{{ p.title }}</h3>
                        <p class="scope">
                          {{ periodLabel(p.periodId) }} · {{ departmentLabel(p.departmentId) }}
                        </p>
                        <p>{{ p.rationale }}</p>
                        <details>
                          <summary>
                            {{ t('hrAssistant.evidence') }} ({{ p.evidence.length }})
                          </summary>
                          <div v-for="e in p.evidence" :key="e.id" class="evidence">
                            <strong>{{ e.source }}</strong>
                            <p>{{ e.text }}</p>
                          </div>
                        </details>
                        <div v-if="p.missingData?.length" class="missing">
                          <strong>{{ t('hrAssistant.missingData') }}</strong>
                          <ul>
                            <li v-for="(item, i) in p.missingData" :key="i">{{ item }}</li>
                          </ul>
                        </div>
                        <form v-if="editing === p.id" class="edit-form" @submit.prevent="save(p)">
                          <label
                            >{{ t('hrAssistant.titleField')
                            }}<input v-model="edit.title" required maxlength="200" :disabled="busy"
                          /></label>
                          <label
                            >{{ t('hrAssistant.actionDetails')
                            }}<textarea
                              v-model="edit.draft"
                              required
                              rows="6"
                              maxlength="3000"
                              :disabled="busy"
                            />
                          </label>
                          <label
                            >{{ t('hrAssistant.destination')
                            }}<select v-model="edit.action" :disabled="busy">
                              <option value="local_task">{{ t('hrAssistant.localTask') }}</option>
                              <option value="jira_task">{{ t('hrAssistant.jiraTask') }}</option>
                            </select></label
                          >
                          <p v-if="edit.action === 'jira_task'" class="hint">
                            {{ t('hrAssistant.jiraPrivacyHint') }}
                          </p>
                          <div class="toolbar">
                            <Button type="submit" :disabled="busy">{{
                              t('hrAssistant.saveDraft')
                            }}</Button
                            ><Button
                              type="button"
                              variant="secondary"
                              :disabled="busy"
                              @click="editing = ''"
                              >{{ t('hrAssistant.cancel') }}</Button
                            >
                          </div>
                        </form>
                        <template v-else>
                          <div class="draft">
                            <strong>{{ t('hrAssistant.plannedAction') }}</strong>
                            <p>{{ p.draft }}</p>
                          </div>
                          <p class="destination">
                            <strong>{{ t('hrAssistant.destinationLabel') }}</strong>
                            {{
                              p.action === 'local_task'
                                ? t('hrAssistant.localTask')
                                : `${p.targetSite} · ${p.targetProject} · ${t('hrAssistant.issueType')} ${p.targetIssueType}`
                            }}
                          </p>
                          <div class="toolbar">
                            <template v-if="p.status === 'pending'"
                              ><Button variant="secondary" :disabled="busy" @click="startEdit(p)">{{
                                t('hrAssistant.editDraft')
                              }}</Button
                              ><Button :disabled="busy" @click="confirm(p, 'approve')">{{
                                t('hrAssistant.approve')
                              }}</Button
                              ><Button
                                variant="secondary"
                                :disabled="busy"
                                @click="confirm(p, 'reject')"
                                >{{ t('hrAssistant.reject') }}</Button
                              ></template
                            >
                            <template v-if="p.status === 'approved'"
                              ><Button :disabled="busy" @click="confirm(p, 'execute')">{{
                                p.action === 'jira_task'
                                  ? t('hrAssistant.jiraTask')
                                  : t('hrAssistant.startFollowup')
                              }}</Button
                              ><Button
                                variant="secondary"
                                :disabled="busy"
                                @click="confirm(p, 'withdraw')"
                                >{{ t('hrAssistant.withdraw') }}</Button
                              ></template
                            >
                            <Button
                              v-if="p.status === 'in_progress'"
                              :disabled="busy"
                              @click="confirm(p, 'complete')"
                              >{{ t('hrAssistant.complete') }}</Button
                            >
                            <Button variant="secondary" :disabled="busy" @click="showHistory(p)">{{
                              t('hrAssistant.history')
                            }}</Button>
                          </div>
                        </template>
                        <div
                          v-if="confirming?.id === p.id"
                          class="confirmation"
                          role="group"
                          :aria-label="t('hrAssistant.confirmAction')"
                        >
                          <p v-if="confirming.action === 'approve'">
                            {{
                              p.action === 'jira_task'
                                ? t('hrAssistant.approveJiraConfirm')
                                : t('hrAssistant.approveLocalConfirm')
                            }}
                          </p>
                          <p v-else-if="confirming.action === 'execute'">
                            {{
                              p.action === 'jira_task'
                                ? t('hrAssistant.executeJiraConfirm')
                                : t('hrAssistant.executeLocalConfirm')
                            }}
                          </p>
                          <p v-else-if="confirming.action === 'withdraw'">
                            {{ t('hrAssistant.withdrawConfirm') }}
                          </p>
                          <p v-else-if="confirming.action === 'reject'">
                            {{ t('hrAssistant.rejectConfirm') }}
                          </p>
                          <label v-if="confirming.action === 'complete'"
                            >{{ t('hrAssistant.outcome')
                            }}<textarea v-model="note" rows="3" maxlength="500" />
                          </label>
                          <div class="toolbar">
                            <Button
                              :disabled="busy || (confirming.action === 'complete' && !note.trim())"
                              @click="apply(p)"
                              >{{ t('hrAssistant.confirm') }}</Button
                            ><Button
                              variant="secondary"
                              :disabled="busy"
                              @click="confirming = null"
                              >{{ t('hrAssistant.cancel') }}</Button
                            >
                          </div>
                        </div>
                        <p v-if="p.resultNote" class="result">{{ p.resultNote }}</p>
                        <p v-if="p.status === 'executing'" class="hint">
                          {{ t('hrAssistant.executingCheck', { id: p.id }) }}
                        </p>
                        <a
                          v-if="p.resultUrl"
                          :href="p.resultUrl"
                          target="_blank"
                          rel="noopener noreferrer"
                          >{{ t('hrAssistant.openJira') }}</a
                        >
                        <div v-if="historyId === p.id" class="history">
                          <details v-for="entry in history" :key="entry.id">
                            <summary>
                              {{ new Date(entry.createdAt).toLocaleString() }} · {{ entry.event }} ·
                              v{{ entry.version }}
                            </summary>
                            <p>{{ t('hrAssistant.actor') }} {{ entry.actorId }}</p>
                            <strong>{{ entry.snapshot.title }}</strong>
                            <p>{{ entry.snapshot.draft }}</p>
                            <p>{{ entry.snapshot.action }} {{ entry.snapshot.targetProject }}</p>
                          </details>
                        </div>
                      </article>
                    </TableCell>
                  </TableRow>
                </template>
                <TableRow v-if="!proposals.length && !error">
                  <TableCell :colspan="6" class="empty">{{ t('hrAssistant.empty') }}</TableCell>
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
      </TabsContent>

      <TabsContent
        v-show="activeTab === 'routing'"
        value="routing"
        force-mount
        class="workspace-content"
      >
        <RoutingBoard />
      </TabsContent>
    </Tabs>
  </HrLayout>
</template>

<style scoped>
.assistant-workspace,
.workspace-content {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
.workspace-content[hidden] {
  display: none;
}
.workspace-header {
  min-width: 0;
}
.workspace-header .card-header {
  margin-bottom: var(--space-3);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.card-header .panel-title {
  margin: 0;
}
.workspace-tabs {
  width: 100%;
  height: auto;
  justify-content: flex-start;
  padding: 0;
  gap: var(--space-4);
  border-radius: 0;
  border-bottom: 1px solid var(--color-border);
  background: transparent;
}
.workspace-tabs :deep([data-slot='tabs-trigger']) {
  flex: 0 1 auto;
  padding: var(--space-3) var(--space-1);
  border: 0;
  border-bottom: 2px solid transparent;
  border-radius: 0;
  box-shadow: none;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  background: transparent;
}
.workspace-tabs :deep([data-state='active']) {
  border-bottom-color: var(--color-primary);
  color: var(--color-primary);
}
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
}
.summary-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
}
.summary-card span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}
.summary-card strong {
  min-height: 1.5em;
  font-size: var(--font-size-xxl);
  font-variant-numeric: tabular-nums;
}
.toolbar,
.playbooks,
.proposal-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
}
.analysis-toolbar {
  align-items: end;
  gap: var(--space-3);
}
.scope-error {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.analysis-toolbar label {
  flex: 1;
}
.playbooks {
  margin-top: var(--space-4);
}
.playbook-caption,
small,
.scope,
.hint {
  color: var(--color-text-muted);
}
.playbook-caption,
.playbook-chip,
.badge {
  font-size: var(--font-size-xs);
}
.playbook-chip,
.badge {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--color-accent-100);
}
.badge {
  display: inline-block;
  color: var(--color-primary);
  white-space: nowrap;
}
.badge.approved,
.badge.completed,
.badge.executed {
  background: var(--color-positive-bg);
  color: var(--color-positive);
}
.badge.needs_check,
.badge.executing {
  background: var(--color-neutral-bg);
  color: var(--color-warning);
}
.badge.rejected {
  background: var(--color-negative-bg);
  color: var(--color-negative);
}
.proposal-name {
  min-width: 24ch;
  max-width: 42ch;
  white-space: normal;
  overflow-wrap: anywhere;
}
.cell-stack {
  display: grid;
  gap: var(--space-1);
}
.cell-stack strong {
  font-weight: 500;
}
.expanded-row {
  background: var(--color-primary-bg);
}
.detail-cell {
  padding: var(--space-4);
  white-space: normal;
}
.proposal,
.edit-form,
.confirmation,
.history {
  display: grid;
  gap: var(--space-3);
}
.proposal {
  padding: var(--space-4);
  border-radius: var(--radius-md);
  background: var(--color-bg);
}
.proposal h3 {
  margin: 0;
  font-size: var(--font-size-lg);
}
p {
  margin: 0;
  line-height: 1.7;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
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
  resize: vertical;
  width: 100%;
}
.draft,
.missing,
.confirmation,
.evidence {
  border-radius: var(--radius-md);
  padding: var(--space-3);
  background: var(--color-surface);
}
.missing {
  border-inline-start: var(--space-1) solid var(--color-warning);
}
.confirmation {
  border: 1px solid var(--color-primary);
}
.evidence {
  margin-top: var(--space-2);
}
.evidence p,
.history {
  font-size: var(--font-size-sm);
}
summary {
  cursor: pointer;
  font-weight: 600;
}
a,
.result {
  color: var(--color-primary);
}
ul {
  margin: var(--space-2) 0 0;
  padding-left: var(--space-4);
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: var(--space-6);
  white-space: normal;
}
.load-error {
  margin-bottom: var(--space-4);
}
@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
  .analysis-toolbar,
  .card-header,
  .card-header .toolbar {
    align-items: stretch;
  }
  .analysis-toolbar > *,
  .card-header .toolbar {
    width: 100%;
  }
  .workspace-tabs :deep([data-slot='tabs-trigger']) {
    flex: 1;
    padding: var(--space-2);
  }
  .status-filter {
    flex: 1;
  }
}
@media (prefers-reduced-motion: reduce) {
  .workspace-tabs :deep([data-slot='tabs-trigger']) {
    transition: none;
  }
}
</style>
