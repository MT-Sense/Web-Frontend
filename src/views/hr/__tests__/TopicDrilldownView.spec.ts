import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { i18n } from '@/i18n'
import TopicDrilldownView from '../TopicDrilldownView.vue'
import * as dashboard from '@/api/dashboard'
import * as periods from '@/api/periods'
import * as departments from '@/api/departments'
import { ApiError } from '@/api/client'
import { downloadCsv } from '@/utils/csv'
import type { TopicDrilldown } from '@/types/topic'

vi.mock('@/api/dashboard', () => ({
  topics: vi.fn<typeof dashboard.topics>(),
  heatmap: vi.fn<typeof dashboard.heatmap>(),
  topicDrilldown: vi.fn<typeof dashboard.topicDrilldown>(),
  generateTopicSummary: vi.fn<typeof dashboard.generateTopicSummary>(),
}))
vi.mock('@/api/periods', () => ({ list: vi.fn<typeof periods.list>() }))
vi.mock('@/api/departments', () => ({ list: vi.fn<typeof departments.list>() }))
vi.mock('@/utils/csv', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/csv')>()),
  downloadCsv: vi.fn<typeof downloadCsv>(),
}))

let wrapper: ReturnType<typeof mount> | undefined
let router: Router
function detail(overrides: Partial<TopicDrilldown> = {}): TopicDrilldown {
  return {
    topicId: 'work',
    label: { th: 'งาน', en: 'Work' },
    periodId: 'nov',
    score: 3.2,
    companyAverage: 3.7,
    respondentCount: 6,
    scopeResponseCount: 20,
    percentageTagged: 30,
    trend: [
      { month: '2026-09', score: 3.8 },
      { month: '2026-10', score: null },
      { month: '2026-11', score: 3.2 },
    ],
    sentiment: { positive: 50, neutral: 0, negative: 50 },
    subIssues: [],
    sampleQuotes: ['Redacted employee comment'],
    ...overrides,
  }
}
function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((done, fail) => {
    resolve = done
    reject = fail
  })
  return { promise, resolve, reject }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(dashboard.topics).mockResolvedValue([
    { id: 'work', label: { th: 'งาน', en: 'Work' } },
    { id: 'benefits', label: { th: 'สวัสดิการ', en: 'Benefits' } },
  ])
  vi.mocked(dashboard.heatmap).mockResolvedValue({
    topics: [{ id: 'emerging', label: { th: 'หัวข้อใหม่', en: 'Emerging topic' } }],
    rows: [],
  })
  vi.mocked(periods.list).mockResolvedValue([
    {
      id: 'feb',
      year: 2027,
      month: 2,
      opensAt: '',
      closesAt: '',
      isOpen: false,
      alreadySubmitted: false,
      responseCount: 30,
      enabledExtraQuestions: [],
    },
    {
      id: 'nov',
      year: 2026,
      month: 11,
      opensAt: '',
      closesAt: '',
      isOpen: false,
      alreadySubmitted: false,
      responseCount: 20,
      enabledExtraQuestions: [],
    },
  ])
  vi.mocked(departments.list).mockResolvedValue([
    { id: 'it', name: 'IT', joinCode: '', createdAt: null },
    { id: 'sales', name: 'Sales', joinCode: '', createdAt: null },
  ])
  vi.mocked(dashboard.topicDrilldown).mockImplementation(async (id, period, department) =>
    detail({
      topicId: id,
      periodId: period ?? 'feb',
      departmentId: department,
      label: { th: id === 'work' ? 'งาน' : 'หัวข้อใหม่', en: id },
      departmentName: department === 'it' ? 'IT' : 'Sales',
    }),
  )
})
afterEach(() => {
  wrapper?.unmount()
})
async function open(path: string) {
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/dashboard/topics/:id?', component: TopicDrilldownView, props: true },
      { path: '/dashboard', component: { template: '<div>Dashboard</div>' } },
      { path: '/action-items', component: { template: '<div>Follow-ups</div>' } },
    ],
  })
  await router.push(path)
  await router.isReady()
  wrapper = mount(
    { template: '<RouterView />' },
    {
      attachTo: document.body,
      global: {
        plugins: [router, i18n],
        stubs: { HrLayout: { template: '<main><slot /></main>' }, InfoTooltip: true },
      },
    },
  )
  await flushPromises()
  return wrapper
}
const filters = () => wrapper!.findAll('.filters select')

it('opens the sidebar entry as a topic chooser and requests an explicitly selected round', async () => {
  const view = await open('/dashboard/topics')
  expect(dashboard.topicDrilldown).not.toHaveBeenCalled()
  expect(dashboard.generateTopicSummary).not.toHaveBeenCalled()
  expect(view.get('.empty-state').text()).toContain(i18n.global.t('drilldown.chooseTopic'))
  expect(view.text()).not.toContain('Redacted employee comment')
  await filters()[0]!.setValue('nov')
  await flushPromises()
  await filters()[1]!.setValue('work')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/dashboard/topics/work')
  expect(router.currentRoute.value.query.period).toBe('nov')
  expect(dashboard.topicDrilldown).toHaveBeenLastCalledWith('work', 'nov', undefined)
  expect(
    filters()[1]!
      .findAll('option')
      .map((option) => option.attributes('value')),
  ).toContain('emerging')
})

it('keeps heatmap context and returns to the original Dashboard filters after changing the selection', async () => {
  const view = await open(
    '/dashboard/topics/work?period=nov&department=it&returnPeriod=nov&returnDepartment=all',
  )
  expect(dashboard.topicDrilldown).toHaveBeenLastCalledWith('work', 'nov', 'it')
  expect(view.get('.selection-context').text()).toContain('2026-11')
  expect(view.get('.selection-context').text()).toContain('IT')
  await filters()[0]!.setValue('feb')
  await flushPromises()
  await filters()[2]!.setValue('sales')
  await flushPromises()
  expect(dashboard.topicDrilldown).toHaveBeenLastCalledWith('work', 'feb', 'sales')
  await view.get('a[href^="/dashboard?"]').trigger('click')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/dashboard')
  expect(router.currentRoute.value.query).toMatchObject({ period: 'nov', department: 'all' })
})

it('displays calendar labels and leaves gaps in the trend, then exports only aggregate data', async () => {
  const view = await open('/dashboard/topics/work?period=nov')
  const path = view.get('.trend-line').attributes('d') ?? ''
  expect(path.match(/M/g)).toHaveLength(2)
  expect(path).not.toContain('L')
  expect(view.get('.trend-panel').text()).toContain('2026')
  expect(view.findAll('.metric-card')).toHaveLength(4)
  await view.get('.card-header button').trigger('click')
  expect(downloadCsv).toHaveBeenCalledOnce()
  const csv = vi.mocked(downloadCsv).mock.calls[0]![1]
  expect(csv).toContain('2026-11')
  expect(csv).not.toContain('Redacted employee comment')
})

it('preserves the selected topic and department when the group is suppressed', async () => {
  vi.mocked(dashboard.topicDrilldown).mockRejectedValue(
    new ApiError(404, 'hidden', [], {
      reason: 'suppressed',
      label: { th: 'งาน', en: 'Work' },
      departmentName: 'IT',
    }),
  )
  const view = await open('/dashboard/topics/work?period=nov&department=it')
  expect(view.get('.unavailable-state').text()).toContain(i18n.global.t('drilldown.suppressed'))
  expect(view.get('.selection-context').text()).toContain('IT')
  expect(view.get('.selection-context').text()).toContain('2026-11')
  expect(view.find('.metric-grid').exists()).toBe(false)
  expect(view.find('.quotes-panel').exists()).toBe(false)
})

it('does not let an older suppressed request replace the latest successful selection', async () => {
  const old = deferred<TopicDrilldown>()
  vi.mocked(dashboard.topicDrilldown).mockImplementation((id, period) =>
    id === 'work'
      ? old.promise
      : Promise.resolve(detail({ topicId: id, periodId: period ?? 'nov', score: 4.4 })),
  )
  const view = await open('/dashboard/topics/work?period=nov')
  expect(view.findAll('.metric-grid .loading-skeleton')).toHaveLength(4)
  await filters()[1]!.setValue('benefits')
  await flushPromises()
  expect(view.get('.metric-card strong').text()).toBe('4.4/5')
  old.reject(new ApiError(404, 'old suppressed', [], { reason: 'suppressed' }))
  await flushPromises()
  expect(view.find('.unavailable-state').exists()).toBe(false)
  expect(view.get('.metric-card strong').text()).toBe('4.4/5')
})

it('keeps technical service details out of the pending state and allows a retry', async () => {
  vi.mocked(dashboard.topicDrilldown).mockRejectedValueOnce(
    new ApiError(404, 'pending', [], { reason: 'analysis_pending', pendingAnalysis: 2 }),
  )
  const view = await open('/dashboard/topics/work?period=nov')
  expect(view.get('.unavailable-state').text()).toContain(
    i18n.global.t('drilldown.analysisPending'),
  )
  expect(view.text()).not.toContain('AI-Service')
  await view.get('.unavailable-state button').trigger('click')
  await flushPromises()
  expect(view.find('.unavailable-state').exists()).toBe(false)
  expect(view.find('.metric-grid').exists()).toBe(true)
})

it('links follow-ups with the topic and current scope without exporting comments', async () => {
  const view = await open('/dashboard/topics/work?period=nov&department=it')
  expect(view.get('.follow-up').text()).toContain(i18n.global.t('drilldown.actionsHelp'))
  await view.get('.follow-up a').trigger('click')
  await flushPromises()
  expect(router.currentRoute.value.path).toBe('/action-items')
  expect(router.currentRoute.value.query).toMatchObject({
    topic: 'work',
    period: 'nov',
    department: 'it',
  })
})

it('distinguishes failed filter loading from an empty survey catalog', async () => {
  vi.mocked(periods.list).mockRejectedValueOnce(new Error('offline'))
  const view = await open('/dashboard/topics/work?period=nov')
  expect(view.get('.topic-controls').text()).toContain(i18n.global.t('common.loadError'))
  expect(view.get('.topic-controls').text()).not.toContain(i18n.global.t('periods.empty'))
  expect(view.find('.empty-state').exists()).toBe(false)
  await view.get('.topic-controls [data-slot="alert"] button').trigger('click')
  await flushPromises()
  expect(filters()[0]!.attributes('disabled')).toBeUndefined()
})
