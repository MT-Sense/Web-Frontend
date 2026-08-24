import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import { visible, suppressed } from '@/types/common'
import type { Topic } from '@/types/topic'
import type { HeatmapRow } from '@/api/dashboard'
import HeatmapGrid from '../HeatmapGrid.vue'

const topics: Topic[] = [
  { id: 'work', label: { th: 'งาน', en: 'Work' } },
  { id: 'team', label: { th: 'ทีม', en: 'Team' } },
]

const rows: HeatmapRow[] = [
  {
    department: { id: 'engineering', name: 'ฝ่ายวิศวกรรม', respondentCount: 76 },
    cells: [
      { topicId: 'work', score: visible(3.9) },
      { topicId: 'team', score: visible(4.2) },
    ],
  },
  {
    department: { id: 'innovation', name: 'ทีมนวัตกรรม', respondentCount: 3 },
    cells: [
      { topicId: 'work', score: suppressed() },
      { topicId: 'team', score: suppressed() },
    ],
  },
]

describe('HeatmapGrid', () => {
  it('renders a suppressed row for departments with respondentCount < 5', () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics, rows },
      global: { plugins: [i18n] },
    })

    expect(wrapper.text()).toContain('ทีมนวัตกรรม')
    expect(wrapper.text()).toContain('ซ่อนเพื่อความเป็นส่วนตัว')

    // A visible department's score should render as a number, not the suppressed label
    expect(wrapper.text()).toContain('ฝ่ายวิศวกรรม')
    expect(wrapper.text()).toContain('3.9')
  })

  it('does not render a numeric score inside the suppressed row', () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics, rows },
      global: { plugins: [i18n] },
    })
    const suppressedRow = wrapper.findAll('.suppressed-row')
    expect(suppressedRow.length).toBe(1)
  })
})
