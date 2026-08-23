import type { RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import type { Role } from '@/types/user'
import { useAuthStore } from '@/stores/auth'

/** Isolated so swapping the mock role source for a JWT-derived one later
 * only changes useAuthStore, not this function.
 *
 * Vue Router starts resolving its initial navigation (and running beforeEach guards) the
 * moment the router is created — independent of when app.mount() runs. Delaying mount until
 * a stored refresh token is hydrated does NOT delay this first guard call, so the guard must
 * await hydration itself. auth.hydrate() is memoized (a single in-flight promise), so this
 * await is a no-op on every navigation after the first. */
export async function requireRole(to: RouteLocationNormalized): Promise<true | RouteLocationRaw> {
  const auth = useAuthStore()
  await auth.hydrate()

  const allowed = to.meta.roles as Role[] | undefined

  if (!allowed) return true // public route

  if (!auth.isAuthenticated) return { path: '/login' }

  if (!auth.currentRole || !allowed.includes(auth.currentRole)) {
    return { path: auth.homeRouteFor(auth.currentRole ?? 'employee') }
  }

  return true
}

export function resolveLayout(role: Role | null) {
  if (role === 'admin') return 'HrLayout'
  if (role === 'executive') return 'ExecutiveLayout'
  return 'EmployeeLayout'
}
