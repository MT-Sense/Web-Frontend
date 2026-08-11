import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import HrLayout from '@/layouts/HrLayout.vue'
import ExecutiveLayout from '@/layouts/ExecutiveLayout.vue'
import EmployeeLayout from '@/layouts/EmployeeLayout.vue'

/** Resolves the correct chrome (sidebar/header) for routes shared across all
 * three roles (/voices, /survey/:id, /settings), keyed off the current mock role. */
export function useRoleLayout() {
  const auth = useAuthStore()

  const layoutComponent = computed(() => {
    if (auth.currentRole === 'HR') return HrLayout
    if (auth.currentRole === 'Executive') return ExecutiveLayout
    return EmployeeLayout
  })

  return { layoutComponent }
}
