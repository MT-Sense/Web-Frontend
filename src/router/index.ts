import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { requireRole } from './guards'
import type { Role } from '@/types/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore()
        return auth.isAuthenticated ? auth.homeRouteFor(auth.currentRole as Role) : '/login'
      },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
    },
    {
      path: '/dashboard',
      name: 'hr-dashboard',
      component: () => import('@/views/hr/HrDashboardView.vue'),
      meta: { roles: ['HR'] as Role[] },
    },
    {
      path: '/dashboard/topics/:id',
      name: 'topic-drilldown',
      component: () => import('@/views/hr/TopicDrilldownView.vue'),
      meta: { roles: ['HR'] as Role[] },
      props: true,
    },
    {
      path: '/forms/builder/:id',
      name: 'form-builder',
      component: () => import('@/views/hr/FormBuilderView.vue'),
      meta: { roles: ['HR'] as Role[] },
      props: true,
    },
    {
      path: '/executive',
      name: 'executive-dashboard',
      component: () => import('@/views/executive/ExecutiveDashboardView.vue'),
      meta: { roles: ['Executive'] as Role[] },
    },
    {
      path: '/voices',
      name: 'voices',
      component: () => import('@/views/employee/VoicesFeedView.vue'),
      meta: { roles: ['HR', 'Executive', 'Employee'] as Role[] },
    },
    {
      path: '/survey/:id',
      name: 'survey',
      component: () => import('@/views/survey/SurveyFormView.vue'),
      meta: { roles: ['HR', 'Executive', 'Employee'] as Role[] },
      props: true,
    },
    {
      path: '/survey/:id/thank-you',
      name: 'survey-thank-you',
      component: () => import('@/views/survey/SurveyThankYouView.vue'),
      meta: { roles: ['HR', 'Executive', 'Employee'] as Role[] },
      props: true,
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
      meta: { roles: ['HR', 'Executive', 'Employee'] as Role[] },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  return requireRole(to)
})

export default router
