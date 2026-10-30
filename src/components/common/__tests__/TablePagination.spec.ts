import { expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import TablePagination from '../TablePagination.vue'

it('disables navigation for an empty table and never shows page zero', () => {
  const wrapper = mount(TablePagination, {
    props: { page: 1, pageSize: 10, total: 0 },
    global: { plugins: [i18n] },
  })
  expect(wrapper.text()).toContain('0-0')
  expect(wrapper.text()).toContain('หน้า 1 จาก 1')
  expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  wrapper.unmount()
})

it('emits page and size changes, and disables all controls while busy', async () => {
  const wrapper = mount(TablePagination, {
    props: { page: 2, pageSize: 10, total: 23 },
    global: { plugins: [i18n] },
  })
  expect(wrapper.text()).toContain('11-20')
  await wrapper.get('button[aria-label="หน้าถัดไป"]').trigger('click')
  expect(wrapper.emitted('update:page')).toEqual([[3]])
  await wrapper.get('select').setValue('5')
  expect(wrapper.emitted('update:pageSize')).toEqual([[5]])
  await wrapper.setProps({ disabled: true })
  expect(wrapper.get('select').attributes('disabled')).toBeDefined()
  expect(wrapper.findAll('button').every((button) => button.attributes('disabled') !== undefined)).toBe(true)
  wrapper.unmount()
})
