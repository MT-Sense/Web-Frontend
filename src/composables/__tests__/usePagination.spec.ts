import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { usePagination } from '../usePagination'

describe('pagination boundaries', () => {
  it('keeps the full list available and slices the last partial page', () => {
    const rows = ref(Array.from({ length: 23 }, (_, index) => index + 1))
    const pagination = usePagination(rows)
    pagination.page.value = 3
    expect(pagination.paginatedItems.value).toEqual([21, 22, 23])
    expect(pagination.total.value).toBe(23)
    expect(rows.value).toHaveLength(23)
  })

  it('returns to the first page when the page size changes', () => {
    const pagination = usePagination(() => Array.from({ length: 30 }, (_, index) => index))
    pagination.page.value = 3
    pagination.pageSize.value = 20
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.paginatedItems.value).toEqual(Array.from({ length: 20 }, (_, index) => index))
  })

  it('clamps the page after a reload shrinks the list and handles an empty list', () => {
    const rows = ref(Array.from({ length: 23 }, (_, index) => index))
    const pagination = usePagination(rows)
    pagination.page.value = 3
    rows.value = [1, 2]
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.paginatedItems.value).toEqual([1, 2])
    rows.value = []
    expect(pagination.pageCount.value).toBe(1)
    expect(pagination.currentPage.value).toBe(1)
    expect(pagination.paginatedItems.value).toEqual([])
  })
})
