<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Lock } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import PrivacySettingsPanel from '@/components/forms/PrivacySettingsPanel.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAsyncData } from '@/composables/useAsyncData'
import * as periodsApi from '@/api/periods'

const { t } = useI18n()

const { data: periods, loading, error, reload } = useAsyncData(() => periodsApi.list())

const creating = ref(false)
const closingId = ref<string | null>(null)

function nextMonthYear(): { month: number; year: number } {
  const latest = periods.value?.[0]
  const base = latest ? new Date(latest.year, latest.month - 1 + 1, 1) : new Date()
  return { month: base.getMonth() + 1, year: base.getFullYear() }
}

async function openNextRound() {
  if (creating.value) return
  creating.value = true
  try {
    await periodsApi.create(nextMonthYear())
    await reload()
  } finally {
    creating.value = false
  }
}

async function closePeriod(id: string) {
  if (closingId.value || !window.confirm(t('periods.closeConfirm'))) return
  closingId.value = id
  try {
    await periodsApi.close(id)
    await reload()
  } finally {
    closingId.value = null
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString()
}
</script>

<template>
  <HrLayout :breadcrumb="t('periods.title')">
    <div class="periods-view">
      <PrivacySettingsPanel />

      <div class="toolbar">
        <p class="subtitle">{{ t('periods.subtitle') }}</p>
        <Button :disabled="creating" @click="openNextRound">
          <Plus :size="16" aria-hidden="true" />
          {{ t('periods.openNext') }}
        </Button>
      </div>

      <p v-if="loading && !periods">{{ t('common.loading') }}</p>
      <Alert v-else-if="error" variant="destructive">
        <AlertDescription>
          {{ t('common.loadError') }}
          <Button variant="link" size="sm" @click="reload">{{ t('common.retry') }}</Button>
        </AlertDescription>
      </Alert>

      <div v-else class="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ t('nav.periods') }}</TableHead>
              <TableHead>{{ t('periods.opensAt') }}</TableHead>
              <TableHead>{{ t('periods.closesAt') }}</TableHead>
              <TableHead>{{ t('periods.responses') }}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="p in periods" :key="p.id">
              <TableCell class="font-semibold">{{ p.year }}-{{ String(p.month).padStart(2, '0') }}</TableCell>
              <TableCell>{{ formatDate(p.opensAt) }}</TableCell>
              <TableCell>{{ formatDate(p.closesAt) }}</TableCell>
              <TableCell>{{ p.responseCount }}</TableCell>
              <TableCell class="status-cell">
                <Badge :variant="p.isOpen ? 'default' : 'secondary'">
                  {{ p.isOpen ? t('periods.open') : t('periods.closed') }}
                </Badge>
                <Button
                  v-if="p.isOpen"
                  variant="secondary"
                  size="sm"
                  :disabled="closingId === p.id"
                  @click="closePeriod(p.id)"
                >
                  <Lock :size="14" aria-hidden="true" />
                  {{ t('periods.close') }}
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  </HrLayout>
</template>

<style scoped>
.periods-view {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  flex-wrap: wrap;
}

.subtitle {
  margin: 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.status-cell {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

@media (max-width: 640px) {
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
