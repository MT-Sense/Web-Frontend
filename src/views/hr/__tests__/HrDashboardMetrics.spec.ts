import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { i18n } from '@/i18n'
import HrDashboardView from '../HrDashboardView.vue'
import * as dashboard from '@/api/dashboard'
import * as periods from '@/api/periods'
import { downloadCsv } from '@/utils/csv'
import { ApiError } from '@/api/client'
import type { HrKpis } from '@/types/kpi'

vi.mock('@/api/periods', () => ({ list: vi.fn<typeof periods.list>(async () => []) }))
vi.mock('@/api/dashboard', () => ({
  hrKpis: vi.fn<typeof dashboard.hrKpis>(),
  departmentTrend: vi.fn<typeof dashboard.departmentTrend>(),
  heatmap: vi.fn<typeof dashboard.heatmap>(async () => ({ topics: [], rows: [] })),
  departmentSummary: vi.fn<typeof dashboard.departmentSummary>(async () => ({ rows: [] })),
  wordCloud: vi.fn<typeof dashboard.wordCloud>(async () => []),
  insight: vi.fn<typeof dashboard.insight>(),
  alerts: vi.fn<typeof dashboard.alerts>(async () => []),
  extraQuestions: vi.fn<typeof dashboard.extraQuestions>(async () => []),
}))
vi.mock('@/utils/csv', async (original) => ({
  ...(await original<typeof import('@/utils/csv')>()),
  downloadCsv: vi.fn<typeof downloadCsv>(),
}))

let wrapper: ReturnType<typeof mount> | undefined
afterEach(() => {
  wrapper?.unmount()
  vi.clearAllMocks()
})

function unavailable(dataState: HrKpis['dataState']): HrKpis {
  return {
    dataState,
    enps: { value: null, deltaVsLastMonth: null },
    satisfaction: { value: null, trend: null },
    burnoutRisk: { percentage: null, departmentsAtRisk: null },
    responseRate: { percentage: null, responded: dataState === 'empty' ? 0 : null, total: null },
    sentiment: null,
    trend: [],
  }
}

async function render(kpis: HrKpis) {
  vi.mocked(dashboard.hrKpis).mockResolvedValue(kpis)
  vi.mocked(dashboard.insight).mockRejectedValue(new ApiError(404, 'not available'))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/dashboard', component: HrDashboardView }],
  })
  await router.push('/dashboard?period=p')
  wrapper = mount(HrDashboardView, {
    global: {
      plugins: [router, i18n],
      stubs: {
        HrLayout: { template: '<main><slot /></main>' },
        KnowledgeQAPanel: true,
        SendSummaryDialog: true,
        DropdownSelect: true,
        TrendLineChart: true,
        HeatmapGrid: true,
        WordCloud: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

describe('HR dashboard metric availability', () => {
  it.each(['empty', 'suppressed'] as const)(
    'does not fabricate numbers for %s data, including CSV',
    async (state) => {
      const view = await render(unavailable(state))
      expect(view.findAll('.kpi-card .value').map((item) => item.text())).toEqual([
        '—',
        '—',
        '—',
        '—',
      ])
      expect(view.text()).toContain(
        i18n.global.t(state === 'empty' ? 'metrics.noResponses' : 'metrics.insufficient'),
      )
      expect(view.text()).not.toMatch(/null%|null\/5|0\/5|0\/100/)
      const exportButton = view
        .findAll('button')
        .find((item) => item.text().includes(i18n.global.t('common.export')))
      await exportButton!.trigger('click')
      expect(downloadCsv).toHaveBeenCalledOnce()
      expect(vi.mocked(downloadCsv).mock.calls[0]![1]).not.toMatch(/null%|null\/5|undefined%/)
    },
  )

  it('preserves measured zeros while explaining a missing response denominator', async () => {
    const kpis = unavailable('available')
    kpis.enps.value = 0
    kpis.satisfaction.value = 3
    kpis.burnoutRisk = { percentage: 0, departmentsAtRisk: 0 }
    kpis.responseRate.responded = 5
    const view = await render(kpis)
    expect(view.findAll('.kpi-card .value').map((item) => item.text())).toEqual([
      '0',
      '3/5',
      '0%',
      '—',
    ])
    expect(view.text()).toContain(i18n.global.t('metrics.noDenominator'))
    expect(view.text()).toContain(i18n.global.t('metrics.noComparison'))
  })
})
