import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import SentimentBar from './SentimentBar.vue'

describe('SentimentBar availability', () => {
  it('shows an explanation instead of fabricated zero percentages', () => {
    const wrapper = mount(SentimentBar, { props: { sentiment: null }, global: { plugins: [i18n] } })
    expect(wrapper.text()).toContain(i18n.global.t('metrics.insufficient'))
    expect(wrapper.findAll('.segment')).toHaveLength(0)
    expect(wrapper.text()).not.toContain('0%')
  })
  it('preserves a genuine zero share in an available distribution', () => {
    const wrapper = mount(SentimentBar, {
      props: { sentiment: { positive: 0, neutral: 13, negative: 87 } },
      global: { plugins: [i18n] },
    })
    expect(wrapper.findAll('.segment')).toHaveLength(3)
    expect(wrapper.text()).toContain('0%')
    expect(wrapper.text()).toContain('87%')
  })
})
