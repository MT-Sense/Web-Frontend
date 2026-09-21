<script setup lang="ts">
import { Bell, CircleCheck } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import type { Alert } from '@/types/alert'
import type { Department } from '@/types/department'

const props = defineProps<{ alerts: Alert[] | null; departments: Department[] }>()
const { t } = useI18n()

function departmentName(id?: string) {
  if (!id) return null
  return props.departments.find((department) => department.id === id)?.name ?? null
}
</script>

<template>
  <div class="alerts-heading">
    <h2>{{ t('alerts.title') }}</h2>
    <span v-if="alerts?.length" class="alert-count">{{ alerts.length }}</span>
  </div>

  <p v-if="alerts === null" class="empty">{{ t('common.loadError') }}</p>
  <div v-else-if="alerts.length === 0" class="empty-state">
    <CircleCheck :size="18" aria-hidden="true" />
    <span>{{ t('alerts.empty') }}</span>
  </div>
  <ul v-else class="alerts-list">
    <li v-for="item in alerts" :key="item.id" class="alert-item" :class="item.severity">
      <Bell :size="18" class="alert-icon" aria-hidden="true" />
      <div class="alert-content">
        <div class="alert-title">
          <strong>{{ t(`alerts.${item.alertType}`) }}</strong>
          <span v-if="departmentName(item.relatedDepartmentId)" class="department-name">
            · {{ departmentName(item.relatedDepartmentId) }}
          </span>
        </div>
        <p>{{ item.message }}</p>
      </div>
      <span class="severity">{{ t(`alerts.severity.${item.severity}`) }}</span>
    </li>
  </ul>
</template>

<style scoped>
.alerts-heading { display: flex; align-items: center; gap: var(--space-2); }
.alerts-heading h2 { margin: 0; }
.alert-count { min-width: 22px; padding: 1px 6px; border-radius: 999px; background: var(--color-negative-bg); color: var(--color-danger); font-size: var(--font-size-xs); font-weight: 700; text-align: center; }
.empty, .empty-state { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.empty { margin: var(--space-4) 0 0; }
.empty-state { display: flex; align-items: center; gap: var(--space-2); margin-top: var(--space-4); }
.empty-state svg { color: var(--color-positive); }
.alerts-list { list-style: none; display: grid; gap: var(--space-2); margin: var(--space-4) 0 0; padding: 0; }
.alert-item { display: flex; align-items: flex-start; gap: var(--space-3); padding: var(--space-3); border-radius: var(--radius-md); background: var(--color-bg); }
.alert-item.critical { background: var(--color-negative-bg); }
.alert-item.warning { background: var(--color-neutral-bg); }
.alert-icon { flex: 0 0 auto; margin-top: 2px; color: var(--color-text-muted); }
.critical .alert-icon { color: var(--color-danger); }
.warning .alert-icon { color: var(--color-warning); }
.alert-content { flex: 1; min-width: 0; font-size: var(--font-size-sm); }
.alert-title { display: flex; flex-wrap: wrap; gap: var(--space-1); }
.department-name { color: var(--color-text-muted); }
.alert-content p { margin: var(--space-1) 0 0; color: var(--color-text-muted); }
.severity { flex: 0 0 auto; font-size: var(--font-size-xs); font-weight: 700; }
.critical .severity { color: var(--color-danger); }
.warning .severity { color: var(--color-warning); }

.panel h2 {
  margin: 0 0 var(--space-4);
  font-size: var(--font-size-md);
  font-weight: 600;
  letter-spacing: -0.01em;
}

@media (max-width: 560px) { .alert-item { flex-wrap: wrap; } .severity { margin-left: 30px; } }
</style>
