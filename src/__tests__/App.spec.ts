import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import { i18n } from '../i18n'
import { requireRole } from '../router/guards'

function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: { template: '<div>login</div>' } },
      {
        path: '/dashboard',
        component: { template: '<div>dashboard</div>' },
        meta: { roles: ['HR'] },
      },
    ],
  })
  router.beforeEach((to) => requireRole(to))
  return router
}

describe('App', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('renders the login route without throwing', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)
    const router = makeRouter()
    router.push('/login')
    await router.isReady()

    const wrapper = mount(App, {
      global: {
        plugins: [pinia, router, i18n],
      },
    })

    expect(wrapper.text()).toContain('login')
  })
})
