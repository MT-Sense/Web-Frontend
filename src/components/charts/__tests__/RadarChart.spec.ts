import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import RadarChart from '../RadarChart.vue'

describe('RadarChart missing and suppressed values', () => {
  it('does not draw a polygon or zero point for missing axes', () => {
    const wrapper = mount(RadarChart, {
      props: {
        axes: [
          { label: 'Work', thisMonth: 4, lastMonth: null },
          { label: 'Team', thisMonth: null, lastMonth: 3 },
          { label: 'Growth', thisMonth: 2, lastMonth: null },
        ],
      },
      global: { plugins: [i18n] },
    })
    expect(wrapper.findAll('circle')).toHaveLength(3)
    expect(wrapper.get('.poly-this').attributes('d')).not.toContain('Z')
    expect(wrapper.get('.poly-this').attributes('d')).not.toContain('L')
    expect(wrapper.get('.poly-this').attributes('style')).toContain('fill: none')
    expect(
      wrapper
        .findAll('title')
        .map((item) => item.text())
        .join(' '),
    ).not.toContain('0/5')
  })

  it('shows an empty state if neither period has visible results', () => {
    const wrapper = mount(RadarChart, {
      props: { axes: [{ label: 'Work', thisMonth: null, lastMonth: null }] },
      global: { plugins: [i18n] },
    })
    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.text()).toContain(i18n.global.t('metrics.insufficient'))
  })

  it('retains a closed shape for a complete series', () => {
    const wrapper = mount(RadarChart, {
      props: {
        axes: ['Work', 'Team', 'Growth'].map((label) => ({ label, thisMonth: 4, lastMonth: 3 })),
      },
      global: { plugins: [i18n] },
    })
    expect(wrapper.get('.poly-this').attributes('d')).toContain(' Z')
    expect(wrapper.findAll('circle')).toHaveLength(6)
  })
})
