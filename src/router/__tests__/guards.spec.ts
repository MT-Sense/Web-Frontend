import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { requireRole } from '../guards'
import { useAuthStore } from '@/stores/auth'
import type { CurrentUser, Role } from '@/types/user'

function route(path: string, roles?: string[]): RouteLocationNormalized {
  return { path, meta: roles ? { roles } : {} } as unknown as RouteLocationNormalized
}

function fakeUser(role: Role): CurrentUser {
  return {
    id: 'u-test',
    email: 'test@example.com',
    fullName: 'Test User',
    role,
    department: 'Test Dept',
    position: 'Test Position',
    lastLoginAt: new Date().toISOString(),
    notifyNewRound: true,
    notifyMonthlySummary: true,
  }
}

describe('requireRole', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  // requireRole awaits auth.hydrate() first (see guards.ts) — with no stored refresh token,
  // hydrate() resolves immediately without a network call, so these stay synchronous-fast.

  it('allows public routes with no meta.roles', async () => {
    expect(await requireRole(route('/login'))).toBe(true)
  })

  it('redirects unauthenticated users to /login', async () => {
    const result = await requireRole(route('/dashboard', ['admin']))
    expect(result).toEqual({ path: '/login' })
  })

  it('redirects a role to its home when the route disallows it', async () => {
    const auth = useAuthStore()
    auth.currentUser = fakeUser('employee')
    auth.accessToken = 'test-token'
    const result = await requireRole(route('/dashboard', ['admin']))
    expect(result).toEqual({ path: '/voices' })
  })

  it('allows access when the current role matches', async () => {
    const auth = useAuthStore()
    auth.currentUser = fakeUser('admin')
    auth.accessToken = 'test-token'
    expect(await requireRole(route('/dashboard', ['admin']))).toBe(true)
  })
})
