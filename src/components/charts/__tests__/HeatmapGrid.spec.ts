import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import { topics } from '@/mocks/topics'
import HeatmapGrid from '../HeatmapGrid.vue'

describe('HeatmapGrid', () => {
  it('renders a suppressed row for departments with respondentCount < 5', () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics },
      global: { plugins: [i18n] },
    })

    // "ทีมนวัตกรรม" (Innovation Team) has respondentCount: 3 in mocks/departments.ts
    expect(wrapper.text()).toContain('ทีมนวัตกรรม')
    expect(wrapper.text()).toContain('ซ่อนเพื่อความเป็นส่วนตัว')

    // A visible department's score should render as a number, not the suppressed label
    expect(wrapper.text()).toContain('ฝ่ายวิศวกรรม')
  })

  it('does not render a numeric score inside the suppressed row', () => {
    const wrapper = mount(HeatmapGrid, {
      props: { topics },
      global: { plugins: [i18n] },
    })
    const suppressedRow = wrapper.findAll('.suppressed-row')
    expect(suppressedRow.length).toBe(1)
  })
})
