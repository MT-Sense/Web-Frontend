import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { i18n } from '@/i18n'
import HrAssistantView from '../HrAssistantView.vue'
import RoutingBoard from '@/components/forms/RoutingBoard.vue'
import * as automation from '@/api/automation'
import * as routing from '@/api/routing'
import * as periods from '@/api/periods'
import * as dashboard from '@/api/dashboard'

vi.mock('@/api/automation', () => ({
  list: vi.fn<typeof automation.list>(),
  listPage: vi.fn<typeof automation.listPage>(),
  generate: vi.fn<typeof automation.generate>(),
  review: vi.fn<typeof automation.review>(),
  execute: vi.fn<typeof automation.execute>(),
  complete: vi.fn<typeof automation.complete>(),
  events: vi.fn<typeof automation.events>(),
}))
vi.mock('@/api/routing', () => ({
  policy: vi.fn<typeof routing.policy>(),
  casesPage: vi.fn<typeof routing.casesPage>(),
  savePolicy: vi.fn<typeof routing.savePolicy>(),
  create: vi.fn<typeof routing.create>(),
  update: vi.fn<typeof routing.update>(),
}))
vi.mock('@/api/periods', () => ({ list: vi.fn<typeof periods.list>() }))
vi.mock('@/api/dashboard', () => ({ departments: vi.fn<typeof dashboard.departments>() }))
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ toast: { success: vi.fn<() => void>(), info: vi.fn<() => void>() } }),
}))

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

let wrapper: ReturnType<typeof mount> | undefined

function proposal(overrides: Partial<automation.Proposal> = {}): automation.Proposal {
  return {
    id: 'proposal-1',
    periodId: 'period-1',
    departmentId: '',
    playbook: 'workload',
    demo: false,
    status: 'pending',
    version: 1,
    title: 'Review workload',
    rationale: 'Workload needs a review',
    missingData: ['Confirm capacity'],
    evidence: [{ id: 'survey', source: 'Survey aggregate', text: 'Aggregated workload evidence' }],
    action: 'local_task',
    draft: 'Review task distribution',
    targetSite: '',
    targetProject: '',
    targetIssueType: '',
    createdAt: '2026-01-31T00:00:00Z',
    ...overrides,
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  let current = proposal()
  vi.mocked(automation.listPage).mockImplementation(async () => ({
    items: [current],
    total: 1,
    page: 1,
    pageSize: 10,
    stats: {
      total: 1,
      pending: current.status === 'pending' ? 1 : 0,
      active: current.status === 'in_progress' ? 1 : 0,
    },
  }))
  vi.mocked(automation.list).mockResolvedValue([
    proposal(),
    proposal({ id: 'demo', demo: true, title: 'Demo proposal' }),
  ])
  vi.mocked(automation.review).mockImplementation(async (p, decision) => {
    current = proposal({
      ...p,
      status: decision === 'approve' ? 'approved' : 'rejected',
      version: p.version + 1,
    })
    return current
  })
  vi.mocked(automation.execute).mockImplementation(async (p) => {
    current = proposal({ ...p, status: 'in_progress', version: p.version + 1 })
    return current
  })
  vi.mocked(periods.list).mockResolvedValue([
    {
      id: 'period-1',
      month: 1,
      year: 2026,
      opensAt: '',
      closesAt: '',
      isOpen: false,
      alreadySubmitted: false,
      responseCount: 20,
      enabledExtraQuestions: [],
    },
  ])
  vi.mocked(dashboard.departments).mockResolvedValue([
    { id: 'engineering', name: 'Engineering', respondentCount: 20 },
  ])
  vi.mocked(routing.policy).mockResolvedValue({ version: 1, rules: [] })
  vi.mocked(routing.casesPage).mockResolvedValue({
    items: [
      {
        id: 'case-1',
        title: 'Equipment issue',
        summary: 'Review shared tools',
        topic: 'Tools',
        departmentId: 'engineering',
        status: 'triage',
        version: 1,
        matchReason: 'Matched tools',
        history: [],
      },
    ],
    total: 1,
    page: 1,
    pageSize: 10,
  })
})

afterEach(() => {
  wrapper?.unmount()
})

async function mountView() {
  wrapper = mount(HrAssistantView, {
    attachTo: document.body,
    global: {
      plugins: [i18n],
      stubs: {
        HrLayout: { template: '<div><slot /></div>' },
        InfoTooltip: true,
        RouterLink: RouterLinkStub,
      },
    },
  })
  await flushPromises()
  return wrapper
}

function button(text: string) {
  const result = wrapper!.findAll('button').find((item) => item.isVisible() && item.text() === text)
  expect(result).toBeDefined()
  return result!
}

it('keeps approval and execution as separate confirmed steps inside proposal details', async () => {
  const view = await mountView()
  expect(view.findAll('table').length).toBe(2)
  expect(view.text()).not.toContain('Demo proposal')
  await button(i18n.global.t('hrAssistant.workspace.details')).trigger('click')
  expect(view.get('#proposal-details-proposal-1').text()).toContain('Aggregated workload evidence')

  await button(i18n.global.t('hrAssistant.approve')).trigger('click')
  expect(automation.review).not.toHaveBeenCalled()
  expect(automation.execute).not.toHaveBeenCalled()
  await button(i18n.global.t('hrAssistant.confirm')).trigger('click')
  await flushPromises()
  expect(automation.review).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'proposal-1', version: 1 }),
    'approve',
  )
  expect(automation.execute).not.toHaveBeenCalled()

  await button(i18n.global.t('hrAssistant.startFollowup')).trigger('click')
  expect(automation.execute).not.toHaveBeenCalled()
  await button(i18n.global.t('hrAssistant.confirm')).trigger('click')
  await flushPromises()
  expect(automation.execute).toHaveBeenCalledWith(
    expect.objectContaining({ id: 'proposal-1', version: 2 }),
  )
})

it('keeps the unsaved routing form mounted when switching between workspaces', async () => {
  const view = await mountView()
  await button(i18n.global.t('hrAssistant.workspace.routingTab')).trigger('keydown', {
    key: 'Enter',
  })
  await button(i18n.global.t('routing.openCase')).trigger('click')
  const board = view.getComponent(RoutingBoard)
  const titleInput = board.get('#routing-create-case input')
  await titleInput.setValue('Unsaved routing case')

  await button(i18n.global.t('hrAssistant.workspace.proposalsTab')).trigger('keydown', {
    key: 'Enter',
  })
  await button(i18n.global.t('hrAssistant.workspace.routingTab')).trigger('keydown', {
    key: 'Enter',
  })
  expect((board.get('#routing-create-case input').element as HTMLInputElement).value).toBe(
    'Unsaved routing case',
  )
  expect(routing.casesPage).toHaveBeenCalledTimes(1)
  expect(routing.create).not.toHaveBeenCalled()
})

it('opens routing details without sending the case to its recipient', async () => {
  const view = await mountView()
  await button(i18n.global.t('hrAssistant.workspace.routingTab')).trigger('keydown', {
    key: 'Enter',
  })
  await button(i18n.global.t('hrAssistant.workspace.details')).trigger('click')
  expect(view.get('#case-details-case-1').text()).toContain('Review shared tools')
  await button(i18n.global.t('routing.review')).trigger('click')
  expect(routing.update).not.toHaveBeenCalled()
  expect(button(i18n.global.t('routing.confirmRoute')).attributes('disabled')).toBeDefined()
})

it('requests proposal pages and filters from the API while keeping global summary counts', async () => {
  vi.mocked(automation.listPage).mockResolvedValue({
    items: [proposal()],
    total: 105,
    page: 1,
    pageSize: 10,
    stats: { total: 105, pending: 30, active: 20 },
  })
  const view = await mountView()
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual([
    '105',
    '30',
    '20',
  ])
  vi.mocked(automation.listPage).mockResolvedValue({
    items: [proposal({ id: 'page-two', title: 'Second page proposal' })],
    total: 105,
    page: 2,
    pageSize: 10,
    stats: { total: 105, pending: 30, active: 20 },
  })
  await view
    .get('.proposal-list button[aria-label="' + i18n.global.t('pagination.next') + '"]')
    .trigger('click')
  await flushPromises()
  expect(automation.listPage).toHaveBeenLastCalledWith(2, 10, 'all')
  expect(view.get('.proposal-list table').text()).toContain('Second page proposal')
  expect(view.get('.proposal-list table').text()).not.toContain('Review workload')

  vi.mocked(automation.listPage).mockResolvedValue({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    stats: { total: 105, pending: 30, active: 20 },
  })
  await view.get('.proposal-list .status-filter select').setValue('pending')
  await flushPromises()
  expect(automation.listPage).toHaveBeenLastCalledWith(1, 10, 'pending')
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual([
    '105',
    '30',
    '20',
  ])
  await view.get('.proposal-list .table-pagination select').setValue('20')
  await flushPromises()
  expect(automation.listPage).toHaveBeenLastCalledWith(1, 20, 'pending')
})

it('requests routing pages and resets the page when status or page size changes', async () => {
  vi.mocked(routing.casesPage).mockResolvedValue({ items: [], total: 105, page: 1, pageSize: 10 })
  const view = await mountView()
  await button(i18n.global.t('hrAssistant.workspace.routingTab')).trigger('keydown', {
    key: 'Enter',
  })
  expect(view.get('.routing .status-filter option[value="all"]').text()).toBe(
    i18n.global.t('routing.allLatest'),
  )
  vi.mocked(routing.casesPage).mockResolvedValue({ items: [], total: 105, page: 2, pageSize: 10 })
  await view
    .get('.routing button[aria-label="' + i18n.global.t('pagination.next') + '"]')
    .trigger('click')
  await flushPromises()
  expect(routing.casesPage).toHaveBeenLastCalledWith(2, 10, 'all')
  vi.mocked(routing.casesPage).mockResolvedValue({ items: [], total: 0, page: 1, pageSize: 10 })
  await view.get('.routing .status-filter select').setValue('triage')
  await flushPromises()
  expect(routing.casesPage).toHaveBeenLastCalledWith(1, 10, 'triage')
  await view.get('.routing .table-pagination select').setValue('20')
  await flushPromises()
  expect(routing.casesPage).toHaveBeenLastCalledWith(1, 20, 'triage')
})

it('shows placeholders until each data source is ready and displays a loaded zero correctly', async () => {
  const proposals = deferred<automation.ProposalPage>()
  const scope = deferred<Awaited<ReturnType<typeof periods.list>>>()
  vi.mocked(automation.listPage).mockReturnValueOnce(proposals.promise)
  vi.mocked(periods.list).mockReturnValueOnce(scope.promise)
  const view = await mountView()
  expect(view.findAll('.summary-grid .loading-skeleton')).toHaveLength(3)
  expect(view.findAll('.summary-card strong').every((item) => !item.text())).toBe(true)
  expect(view.get('.summary-grid [role="status"]').text()).toBe(i18n.global.t('common.loading'))
  expect(view.findAll('.analysis-toolbar .loading-skeleton')).toHaveLength(2)
  expect(view.findAll('.analysis-toolbar select')).toHaveLength(0)
  expect(view.get('.analysis-toolbar button').attributes('disabled')).toBeDefined()

  proposals.resolve({
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    stats: { total: 0, pending: 0, active: 0 },
  })
  await flushPromises()
  expect(view.findAll('.summary-grid .loading-skeleton')).toHaveLength(0)
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['0', '0', '0'])
  expect(view.findAll('.analysis-toolbar .loading-skeleton')).toHaveLength(2)

  scope.resolve([])
  await flushPromises()
  expect(view.findAll('.analysis-toolbar .loading-skeleton')).toHaveLength(0)
  expect(view.findAll('.analysis-toolbar select')).toHaveLength(2)
  expect(view.get('.analysis-toolbar').attributes('aria-busy')).toBe('false')
  expect(view.get('.analysis-toolbar button').attributes('disabled')).toBeDefined()
})

it('keeps loaded summary values and scope controls while refreshing the list', async () => {
  const view = await mountView()
  const refresh = deferred<automation.ProposalPage>()
  vi.mocked(automation.listPage).mockReturnValueOnce(refresh.promise)
  await view.get('.proposal-list .toolbar button').trigger('click')
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['1', '1', '0'])
  expect(view.findAll('.summary-grid .loading-skeleton')).toHaveLength(0)
  expect(view.findAll('.analysis-toolbar .loading-skeleton')).toHaveLength(0)
  expect(view.get('.analysis-toolbar button').text()).toBe(i18n.global.t('hrAssistant.analyze'))
  refresh.resolve({
    items: [],
    total: 2,
    page: 1,
    pageSize: 10,
    stats: { total: 2, pending: 0, active: 1 },
  })
  await flushPromises()
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['2', '0', '1'])
})

it('allows retrying scope options independently when proposals have loaded', async () => {
  vi.mocked(periods.list).mockRejectedValueOnce(new Error('Scope options failed'))
  const view = await mountView()
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['1', '1', '0'])
  expect(view.get('.scope-error').text()).toContain('Scope options failed')
  expect(
    view
      .findAll('.analysis-toolbar select')
      .every((item) => item.attributes('disabled') !== undefined),
  ).toBe(true)
  expect(view.get('.analysis-toolbar button').attributes('disabled')).toBeDefined()
  await view.get('.scope-error button').trigger('click')
  await flushPromises()
  expect(view.find('.scope-error').exists()).toBe(false)
  expect(view.get('.analysis-toolbar button').attributes('disabled')).toBeUndefined()
  expect(automation.listPage).toHaveBeenCalledTimes(1)
})

it('ends summary loading on failure without presenting unknown values as zero', async () => {
  vi.mocked(automation.listPage).mockRejectedValueOnce(new Error('Proposals failed'))
  const view = await mountView()
  expect(view.findAll('.summary-grid .loading-skeleton')).toHaveLength(0)
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['—', '—', '—'])
  expect(view.get('.proposal-list').text()).toContain('Proposals failed')
  await view.get('.proposal-list .toolbar button').trigger('click')
  await flushPromises()
  expect(view.findAll('.summary-card strong').map((item) => item.text())).toEqual(['1', '1', '0'])
})
