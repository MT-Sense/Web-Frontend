import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, shallowMount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import * as periodsApi from '@/api/periods'
import SurveyPeriodsView from '../SurveyPeriodsView.vue'
import TablePagination from '@/components/common/TablePagination.vue'
import { Button } from '@/components/ui/button'

vi.mock('@/api/periods', () => ({
  listPage: vi.fn<typeof periodsApi.listPage>(),
  list: vi.fn<typeof periodsApi.list>(),
  create: vi.fn<typeof periodsApi.create>(),
  close: vi.fn<typeof periodsApi.close>(),
}))
vi.mock('@/api/survey', () => ({
  catalog: vi.fn<() => Promise<unknown[]>>().mockResolvedValue([]),
}))

let wrapper: ReturnType<typeof shallowMount> | undefined

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(periodsApi.listPage).mockImplementation(async (page, pageSize) => ({
    page, pageSize, total: 25, latestPeriod: { month: 12, year: 2026 },
    items: [{
      id: `page-${page}`, month: page === 1 ? 12 : 7, year: page === 1 ? 2026 : 2025,
      opensAt: '2025-07-01T00:00:00Z', closesAt: '2025-08-01T00:00:00Z',
      isOpen: false, alreadySubmitted: false, responseCount: 0, enabledExtraQuestions: [],
    }],
  }))
})

afterEach(() => {
  wrapper?.unmount()
})

function mountView() {
  return shallowMount(SurveyPeriodsView, {
    global: { plugins: [i18n], renderStubDefaultSlot: true },
  })
}

it('requests each page from the API and resets to page one when size changes', async () => {
  wrapper = mountView()
  await flushPromises()
  expect(periodsApi.listPage).toHaveBeenLastCalledWith(1, 10)

  wrapper.findComponent(TablePagination).vm.$emit('update:page', 2)
  await flushPromises()
  expect(periodsApi.listPage).toHaveBeenLastCalledWith(2, 10)

  wrapper.findComponent(TablePagination).vm.$emit('update:pageSize', 5)
  await flushPromises()
  expect(periodsApi.listPage).toHaveBeenLastCalledWith(1, 5)
  expect(periodsApi.listPage).toHaveBeenCalledTimes(3)
  expect(periodsApi.list).not.toHaveBeenCalled()
})

it('creates the next month from organization metadata even when viewing an older page', async () => {
  wrapper = mountView()
  await flushPromises()
  wrapper.findComponent(TablePagination).vm.$emit('update:page', 2)
  await flushPromises()

  const openButton = wrapper.findAllComponents(Button)
    .find((button) => button.text().includes(i18n.global.t('periods.openNext')))
  expect(openButton).toBeDefined()
  openButton!.vm.$emit('click')
  await flushPromises()

  expect(periodsApi.create).toHaveBeenCalledWith({ month: 1, year: 2027, enabledExtraQuestions: [] })
  expect(periodsApi.listPage).toHaveBeenLastCalledWith(1, 10)
})
