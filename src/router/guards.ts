import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Role } from '@/types/user'
import { useAuthStore } from '@/stores/auth'

/** Isolated so swapping the mock role source for a JWT-derived one later
 * only changes useAuthStore, not this function. */
export function requireRole(to: RouteLocationNormalized): true | RouteLocationRaw {
  const auth = useAuthStore()
  const allowed = to.meta.roles as Role[] | undefined

  if (!allowed) return true // public route

  if (!auth.isAuthenticated) return { path: '/login' }

  if (!auth.currentRole || !allowed.includes(auth.currentRole)) {
    return { path: auth.homeRouteFor(auth.currentRole ?? 'Employee') }
  }

  return true
}

export function resolveLayout(role: Role | null) {
  if (role === 'HR') return 'HrLayout'
  if (role === 'Executive') return 'ExecutiveLayout'
  return 'EmployeeLayout'
}
