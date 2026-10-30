import { computed, ref, toValue, watch, type MaybeRefOrGetter } from 'vue'

/** Client-side slicing; the pagination controls themselves also support server-side lists. */
export function usePagination<T>(items: MaybeRefOrGetter<readonly T[]>, initialPageSize = 10) {
  const page = ref(1)
  const pageSize = ref(Math.max(1, initialPageSize))
  const total = computed(() => toValue(items).length)
  const pageCount = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const currentPage = computed(() => Math.min(Math.max(1, page.value), pageCount.value))
  const paginatedItems = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value
    return toValue(items).slice(start, start + pageSize.value)
  })

  watch(pageSize, () => {
    page.value = 1
  }, { flush: 'sync' })

  watch(pageCount, () => {
    page.value = currentPage.value
  }, { flush: 'sync' })

  return { page, pageSize, total, currentPage, pageCount, paginatedItems }
}
