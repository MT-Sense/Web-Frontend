import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import type { RouteLocationNormalized } from 'vue-router'
import { requireRole } from '../guards'
import { useAuthStore } from '@/stores/auth'

function route(path: string, roles?: string[]): RouteLocationNormalized {
  return { path, meta: roles ? { roles } : {} } as unknown as RouteLocationNormalized
}

describe('requireRole', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    sessionStorage.clear()
  })

  it('allows public routes with no meta.roles', () => {
    expect(requireRole(route('/login'))).toBe(true)
  })

  it('redirects unauthenticated users to /login', () => {
    const result = requireRole(route('/dashboard', ['HR']))
    expect(result).toEqual({ path: '/login' })
  })

  it('redirects a role to its home when the route disallows it', () => {
    const auth = useAuthStore()
    auth.switchRole('Employee')
    const result = requireRole(route('/dashboard', ['HR']))
    expect(result).toEqual({ path: '/voices' })
  })

  it('allows access when the current role matches', () => {
    const auth = useAuthStore()
    auth.switchRole('HR')
    expect(requireRole(route('/dashboard', ['HR']))).toBe(true)
  })
})
