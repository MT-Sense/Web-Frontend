<script setup lang="ts">
import { computed, useId } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'

const props = defineProps<{
  page: number
  pageSize: number
  total: number
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:page': [page: number]
  'update:pageSize': [pageSize: number]
}>()

const { t } = useI18n()
const selectId = useId()
const sizes = [5, 10, 20, 50]
const pageCount = computed(() => Math.max(1, Math.ceil(props.total / Math.max(1, props.pageSize))))
const currentPage = computed(() => Math.min(Math.max(1, props.page), pageCount.value))
const firstRow = computed(() => props.total === 0 ? 0 : (currentPage.value - 1) * props.pageSize + 1)
const lastRow = computed(() => Math.min(currentPage.value * props.pageSize, props.total))

function changePageSize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value)
  if (sizes.includes(size)) emit('update:pageSize', size)
}
</script>

<template>
  <nav class="table-pagination" :aria-label="t('pagination.label')">
    <p class="result-count" role="status">
      {{ t('pagination.showing', { start: firstRow, end: lastRow, total }) }}
    </p>

    <div class="pagination-controls">
      <label :for="selectId">{{ t('pagination.perPage') }}</label>
      <select :id="selectId" :value="pageSize" :disabled="disabled" @change="changePageSize">
        <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
      </select>

      <span>{{ t('pagination.pageOf', { page: currentPage, total: pageCount }) }}</span>
      <div class="page-buttons">
        <Button
          variant="secondary" size="sm"
          :aria-label="t('pagination.first')" :title="t('pagination.first')"
          :disabled="disabled || currentPage <= 1"
          @click="emit('update:page', 1)"
        >
          <ChevronsLeft :size="16" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary" size="sm"
          :aria-label="t('pagination.previous')" :title="t('pagination.previous')"
          :disabled="disabled || currentPage <= 1"
          @click="emit('update:page', currentPage - 1)"
        >
          <ChevronLeft :size="16" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary" size="sm"
          :aria-label="t('pagination.next')" :title="t('pagination.next')"
          :disabled="disabled || currentPage >= pageCount"
          @click="emit('update:page', currentPage + 1)"
        >
          <ChevronRight :size="16" aria-hidden="true" />
        </Button>
        <Button
          variant="secondary" size="sm"
          :aria-label="t('pagination.last')" :title="t('pagination.last')"
          :disabled="disabled || currentPage >= pageCount"
          @click="emit('update:page', pageCount)"
        >
          <ChevronsRight :size="16" aria-hidden="true" />
        </Button>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--color-border);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.result-count { margin: 0; }

.pagination-controls,
.page-buttons {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
}

select {
  padding: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  cursor: pointer;
}

select:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
