import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { Role } from '@/types/user'
import { usersByRole } from '@/mocks/users'

const STORAGE_KEY = 'mt-sense-role'

function homeRouteFor(role: Role): string {
  if (role === 'HR') return '/dashboard'
  if (role === 'Executive') return '/executive'
  return '/voices'
}

export const useAuthStore = defineStore('auth', () => {
  const storedRole = sessionStorage.getItem(STORAGE_KEY) as Role | null
  const currentRole = ref<Role | null>(storedRole)

  const currentUser = computed(() => (currentRole.value ? usersByRole[currentRole.value] : null))
  const isAuthenticated = computed(() => currentRole.value !== null)

  /** Dev-only mock login. In the backend pass this becomes: decode role from JWT after
   * a real /api/auth/login call — the role is never chosen by the user in production. */
  function switchRole(role: Role) {
    currentRole.value = role
    sessionStorage.setItem(STORAGE_KEY, role)
  }

  function logout() {
    currentRole.value = null
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { currentRole, currentUser, isAuthenticated, switchRole, logout, homeRouteFor }
})
