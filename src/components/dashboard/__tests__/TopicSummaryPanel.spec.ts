import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import TopicSummaryPanel from '../TopicSummaryPanel.vue'
import { generateTopicSummary } from '@/api/dashboard'
import { ApiError } from '@/api/client'
import type { TopicDrilldown, TopicSummary } from '@/types/topic'

vi.mock('@/api/dashboard', () => ({ generateTopicSummary: vi.fn<typeof generateTopicSummary>() }))
let wrapper: ReturnType<typeof mount> | undefined
const source = (overrides: Partial<TopicDrilldown> = {}): TopicDrilldown => ({
  topicId: 'work',
  periodId: 'nov',
  departmentId: 'it',
  label: { th: 'งาน', en: 'Work' },
  score: 3,
  companyAverage: 3.7,
  respondentCount: 5,
  scopeResponseCount: 10,
  percentageTagged: 50,
  trend: [],
  subIssues: [],
  sentiment: { positive: 50, neutral: 0, negative: 50 },
  sampleQuotes: [],
  ...overrides,
})
const summary = (overrides: Partial<TopicSummary> = {}): TopicSummary => ({
  topicId: 'work',
  periodId: 'nov',
  departmentId: 'it',
  sampledComments: 12,
  generatedAt: '2026-11-30T00:00:00Z',
  model: 'gemini-3.5-flash-lite',
  themes: [
    {
      title: { th: 'วางแผนงาน', en: 'Work planning' },
      summary: { th: 'ต้องการปรับปรุงการวางแผน', en: 'Improve planning' },
      supportingCount: 5,
      excerpts: ['Evidence from the actual input'],
    },
  ],
  ...overrides,
})
function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(generateTopicSummary).mockResolvedValue(summary())
})
afterEach(() => {
  wrapper?.unmount()
})
function open() {
  wrapper = mount(TopicSummaryPanel, {
    props: { source: source() },
    global: { plugins: [i18n], stubs: { InfoTooltip: true } },
  })
  return wrapper
}

it('never sends comments on mount or filter changes; sends only selected IDs after the button click', async () => {
  const view = open()
  expect(generateTopicSummary).not.toHaveBeenCalled()
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.consent'))
  await view.setProps({ source: source({ departmentId: 'sales' }) })
  expect(generateTopicSummary).not.toHaveBeenCalled()
  vi.mocked(generateTopicSummary).mockResolvedValue(summary({ departmentId: 'sales' }))
  await view.get('.summary-header button').trigger('click')
  await flushPromises()
  expect(generateTopicSummary).toHaveBeenCalledExactlyOnceWith('work', 'nov', 'sales')
  expect(view.text()).toContain('วางแผนงาน')
  expect(view.get('details').text()).toContain('Evidence from the actual input')
})

it('prevents duplicate clicks while generation is pending', async () => {
  const request = deferred<TopicSummary>()
  vi.mocked(generateTopicSummary).mockReturnValue(request.promise)
  const view = open()
  await view.get('.summary-header button').trigger('click')
  expect(view.attributes('aria-busy')).toBe('true')
  expect(view.get('.summary-header button').attributes('disabled')).toBeDefined()
  await view.get('.summary-header button').trigger('click')
  expect(generateTopicSummary).toHaveBeenCalledTimes(1)
  request.resolve(summary())
  await flushPromises()
  expect(view.attributes('aria-busy')).toBe('false')
})

it('clears old results and ignores a pending response from a previous scope', async () => {
  const old = deferred<TopicSummary>()
  vi.mocked(generateTopicSummary).mockReturnValueOnce(old.promise)
  const view = open()
  await view.get('.summary-header button').trigger('click')
  await view.setProps({ source: source({ periodId: 'dec' }) })
  expect(view.find('.theme').exists()).toBe(false)
  vi.mocked(generateTopicSummary).mockResolvedValueOnce(summary({ periodId: 'dec', themes: [] }))
  await view.get('.summary-header button').trigger('click')
  await flushPromises()
  old.resolve(summary())
  await flushPromises()
  expect(view.find('.theme').exists()).toBe(false)
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.empty'))
  await view.setProps({ source: source({ periodId: 'dec' }) })
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.idle'))
})

it('rejects a response for the wrong selection instead of showing it', async () => {
  vi.mocked(generateTopicSummary).mockResolvedValue(summary({ departmentId: 'foreign' }))
  const view = open()
  await view.get('.summary-header button').trigger('click')
  await flushPromises()
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.failed'))
  expect(view.find('.theme').exists()).toBe(false)
})

it.each([
  ['summary_provider_request', 'providerRequest'],
  ['summary_provider_auth', 'providerAuth'],
  ['summary_model_unavailable', 'modelUnavailable'],
  ['summary_provider_quota', 'providerQuota'],
  ['summary_timeout', 'timeout'],
  ['summary_invalid_response', 'invalidResponse'],
  ['summary_invalid_evidence', 'invalidEvidence'],
])('shows the safe diagnostic for %s', async (code, key) => {
  vi.mocked(generateTopicSummary).mockRejectedValue(
    new ApiError(502, 'PRIVATE provider text', [], { code }),
  )
  const view = open()
  await view.get('.summary-header button').trigger('click')
  await flushPromises()
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.' + key))
  expect(view.text()).not.toContain('PRIVATE')
  expect(view.find('.theme').exists()).toBe(false)
})

it.each([
  [422, 'insufficient'],
  [429, 'rateLimited'],
  [502, 'failed'],
  [503, 'failed'],
])('handles status %s without showing server payloads or mock themes', async (status, key) => {
  vi.mocked(generateTopicSummary).mockRejectedValue(new ApiError(status, 'PRIVATE server text'))
  const view = open()
  await view.get('.summary-header button').trigger('click')
  await flushPromises()
  expect(view.text()).toContain(i18n.global.t('drilldown.aiSummary.' + key))
  expect(view.text()).not.toContain('PRIVATE')
  expect(view.find('.theme').exists()).toBe(false)
})
