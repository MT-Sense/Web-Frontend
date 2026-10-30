import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import InfoTooltip from '../InfoTooltip.vue'

let wrapper: ReturnType<typeof mount> | undefined

beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class {
    observe = vi.fn<ResizeObserver['observe']>()
    unobserve = vi.fn<ResizeObserver['unobserve']>()
    disconnect = vi.fn<ResizeObserver['disconnect']>()
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  wrapper?.unmount()
  document.body.innerHTML = ''
})

it('shows help on keyboard focus and dismisses it with Escape', async () => {
  wrapper = mount(InfoTooltip, {
    attachTo: document.body,
    props: { label: 'Heatmap', text: 'Only groups with at least five responses are shown.' },
    global: { plugins: [i18n] },
  })

  const trigger = wrapper.get('button')
  expect(trigger.attributes('type')).toBe('button')
  expect(trigger.attributes('aria-label')).toContain('Heatmap')
  expect(document.querySelector('[role="tooltip"]')).toBeNull()

  trigger.element.focus()
  await flushPromises()
  expect(document.querySelector('[role="tooltip"]')?.textContent)
    .toContain('Only groups with at least five responses are shown.')

  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
  await flushPromises()
  expect(document.querySelector('[role="tooltip"]')).toBeNull()
})
