<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Role } from '@/types/user'

const props = defineProps<{ role: Role }>()
const { t } = useI18n()

const classByRole: Record<Role, string> = {
  HR: 'badge-hr',
  Executive: 'badge-executive',
  Employee: 'badge-employee',
}
</script>

<template>
  <span class="role-badge" :class="classByRole[props.role]">{{ t(`role.${props.role}`) }}</span>
</template>

<style scoped>
.role-badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: 999px;
  font-size: var(--font-size-xs);
  font-weight: 700;
}

.badge-hr {
  background: var(--color-hr-bg);
  color: var(--color-hr);
}

.badge-executive {
  background: var(--color-executive-bg);
  color: var(--color-executive);
}

.badge-employee {
  background: var(--color-employee-bg);
  color: var(--color-employee);
}
</style>
