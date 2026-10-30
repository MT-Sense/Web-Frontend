import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { i18n } from '@/i18n'
import { ApiError } from '@/api/client'
import * as departmentsApi from '@/api/departments'
import DepartmentsView from '../DepartmentsView.vue'
import TablePagination from '@/components/common/TablePagination.vue'

vi.mock('@/api/departments', () => ({
  list: vi.fn<typeof departmentsApi.list>(),
  listPage: vi.fn<typeof departmentsApi.listPage>(),
  create: vi.fn<typeof departmentsApi.create>(),
  update: vi.fn<typeof departmentsApi.update>(),
  remove: vi.fn<typeof departmentsApi.remove>(),
}))

let wrapper: ReturnType<typeof mount> | undefined
let records: departmentsApi.DepartmentWithCode[]

beforeEach(() => {
  vi.resetAllMocks()
  records = [
    { id: 'engineering', name: 'Engineering', joinCode: 'ENG001', createdAt: '2024-02-10T09:00:00Z' },
    { id: 'legacy', name: 'Legacy', joinCode: '', createdAt: null },
  ]
  vi.mocked(departmentsApi.listPage).mockImplementation(async (requestedPage, pageSize) => {
    const page = Math.min(requestedPage, Math.max(1, Math.ceil(records.length / pageSize)))
    return {
      page, pageSize, total: records.length,
      items: records.slice((page - 1) * pageSize, page * pageSize).map((row) => ({ ...row })),
    }
  })
})

afterEach(() => {
  wrapper?.unmount()
})

async function mountView() {
  wrapper = mount(DepartmentsView, {
    global: {
      plugins: [i18n],
      stubs: { HrLayout: { template: '<div><slot /></div>' }, InfoTooltip: true },
    },
  })
  await flushPromises()
  return wrapper
}

function button(text: string) {
  const result = wrapper!.findAll('button').find((item) => item.text() === text)
  expect(result).toBeDefined()
  return result!
}

it('renders database timestamps in a table and preserves missing historical dates', async () => {
  const view = await mountView()
  expect(view.get('table').text()).toContain(i18n.global.t('departments.createdAt'))
  expect(view.get('time').attributes('datetime')).toBe('2024-02-10T09:00:00Z')
  expect(view.text()).toContain(i18n.global.t('departments.unknownDate'))
})

it('creates a department from the header form and refreshes the table', async () => {
  vi.mocked(departmentsApi.create).mockImplementation(async (name) => {
    const record = { id: 'new', name, joinCode: 'NEW001', createdAt: '2026-10-30T09:00:00Z' }
    records.push(record)
    return record
  })
  const view = await mountView()
  await button(i18n.global.t('departments.create')).trigger('click')
  await view.get('#department-name').setValue('New team')
  await view.get('#department-create-form').trigger('submit')
  await flushPromises()
  expect(departmentsApi.create).toHaveBeenCalledWith('New team')
  expect(view.text()).toContain('New team')
  expect(view.find('#department-create-form').exists()).toBe(false)
})

it('saves an inline edit without changing the creation date', async () => {
  vi.mocked(departmentsApi.update).mockImplementation(async (id, name) => {
    records[0] = { ...records[0]!, id, name }
    return records[0]!
  })
  const view = await mountView()
  await button(i18n.global.t('departments.edit')).trigger('click')
  await view.get('#department-edit-engineering').setValue('Platform')
  expect(view.get('button[form="department-edit-form-engineering"]').attributes('type')).toBe('submit')
  await view.get('#department-edit-form-engineering').trigger('submit')
  await flushPromises()
  expect(departmentsApi.update).toHaveBeenCalledWith('engineering', 'Platform')
  expect(view.text()).toContain('Platform')
  expect(view.get('time').attributes('datetime')).toBe('2024-02-10T09:00:00Z')
})

it('keeps the department visible when the backend rejects deleting a referenced group', async () => {
  vi.mocked(departmentsApi.remove).mockRejectedValue(new ApiError(409, 'in use'))
  const view = await mountView()
  await button(i18n.global.t('departments.delete')).trigger('click')
  await button(i18n.global.t('departments.confirmDelete')).trigger('click')
  await flushPromises()
  expect(departmentsApi.remove).toHaveBeenCalledWith('engineering')
  expect(view.text()).toContain('Engineering')
  expect(view.text()).toContain(i18n.global.t('departments.inUse'))
})

it('calls the API for each page and resets when page size changes', async () => {
  records.push(...Array.from({ length: 13 }, (_, index) => ({
    id: `more-${index}`, name: `Department ${index}`, joinCode: '', createdAt: null,
  })))
  const view = await mountView()
  expect(departmentsApi.listPage).toHaveBeenLastCalledWith(1, 10)
  view.findComponent(TablePagination).vm.$emit('update:page', 2)
  await flushPromises()
  expect(departmentsApi.listPage).toHaveBeenLastCalledWith(2, 10)
  expect(view.get('table').text()).not.toContain('Engineering')
  view.findComponent(TablePagination).vm.$emit('update:pageSize', 5)
  await flushPromises()
  expect(departmentsApi.listPage).toHaveBeenLastCalledWith(1, 5)
  expect(departmentsApi.listPage).toHaveBeenCalledTimes(3)
  expect(departmentsApi.list).not.toHaveBeenCalled()
})

it('returns to a valid page after deleting the only item on the last page', async () => {
  records.push(...Array.from({ length: 9 }, (_, index) => ({
    id: `more-${index}`, name: `Department ${index}`, joinCode: '', createdAt: null,
  })))
  vi.mocked(departmentsApi.remove).mockImplementation(async (id) => {
    records = records.filter((row) => row.id !== id)
  })
  const view = await mountView()
  view.findComponent(TablePagination).vm.$emit('update:page', 2)
  await flushPromises()
  await button(i18n.global.t('departments.delete')).trigger('click')
  await button(i18n.global.t('departments.confirmDelete')).trigger('click')
  await flushPromises()
  expect(view.findComponent(TablePagination).props('page')).toBe(1)
  expect(view.findComponent(TablePagination).props('total')).toBe(10)
  expect(view.get('table').text()).toContain('Engineering')
})

