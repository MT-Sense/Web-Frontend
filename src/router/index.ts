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
      path: '/signup',
      name: 'signup',
      component: () => import('@/views/onboarding/SignupView.vue'),
    },
    {
      path: '/join',
      name: 'join',
      component: () => import('@/views/onboarding/JoinView.vue'),
    },
    {
      path: '/join/:code/register',
      name: 'join-register',
      component: () => import('@/views/onboarding/RegisterAccountView.vue'),
      props: true,
    },
    {
      path: '/dashboard',
      name: 'hr-dashboard',
      component: () => import('@/views/hr/HrDashboardView.vue'),
      meta: { roles: ['admin'] as Role[] },
    },
    {
      path: '/dashboard/topics/:id',
      name: 'topic-drilldown',
      component: () => import('@/views/hr/TopicDrilldownView.vue'),
      meta: { roles: ['admin'] as Role[] },
      props: true,
    },
    {
      path: '/survey-periods',
      name: 'survey-periods',
      component: () => import('@/views/hr/SurveyPeriodsView.vue'),
      meta: { roles: ['admin'] as Role[] },
    },
    {
      path: '/departments',
      name: 'departments',
      component: () => import('@/views/hr/DepartmentsView.vue'),
      meta: { roles: ['admin'] as Role[] },
    },
    {
      path: '/model-training',
      name: 'model-training',
      component: () => import('@/views/hr/ModelTrainingView.vue'),
      meta: { roles: ['admin'] as Role[] },
      beforeEnter: () => {
        const auth = useAuthStore()
        return auth.currentUser?.email?.trim().toLowerCase() === 'test@kmitl.ac.th' ? true : '/dashboard'
      },
    },
    {
      path: '/executive',
      name: 'executive-dashboard',
      component: () => import('@/views/executive/ExecutiveDashboardView.vue'),
      meta: { roles: ['executive'] as Role[] },
    },
    {
      path: '/voices',
      name: 'voices',
      component: () => import('@/views/employee/VoicesFeedView.vue'),
      meta: { roles: ['admin', 'executive', 'employee'] as Role[] },
    },
    {
      path: '/survey',
      name: 'survey',
      component: () => import('@/views/survey/SurveyFormView.vue'),
      meta: { roles: ['admin', 'executive', 'employee'] as Role[] },
    },
    {
      path: '/survey/thank-you',
      name: 'survey-thank-you',
      component: () => import('@/views/survey/SurveyThankYouView.vue'),
      meta: { roles: ['admin', 'executive', 'employee'] as Role[] },
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('@/views/settings/SettingsView.vue'),
      meta: { roles: ['admin', 'executive', 'employee'] as Role[] },
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
