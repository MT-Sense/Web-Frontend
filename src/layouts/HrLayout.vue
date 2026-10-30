<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  FolderKanban,
  LayoutDashboard,
  MessageSquare,
  BrainCircuit,
  Building2,
  FileEdit,
  ListChecks,
  Newspaper,
  Settings,
  Users,
  ShieldCheck,
  Wrench,
} from '@lucide/vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import SidebarNav, { type NavItem } from '@/components/layout/SidebarNav.vue'
import { useAuthStore } from '@/stores/auth'

withDefaults(defineProps<{ breadcrumb?: string }>(), { breadcrumb: '' })

const { t } = useI18n()
const auth = useAuthStore()

const items = computed<NavItem[]>(() => {
  const overview = t('navSections.overview')
  const voices = t('navSections.voices')
  const surveys = t('navSections.surveys')
  const organization = t('navSections.organization')
  const system = t('navSections.system')
  return [
    { section: overview, label: t('nav.dashboard'), to: '/dashboard', icon: LayoutDashboard },
    { section: overview, label: t('nav.topics'), to: '/dashboard/topics', activePath: '/dashboard/topics', icon: FolderKanban },
    { section: overview, label: t('nav.hrAssistant'), to: '/hr-assistant', icon: BrainCircuit },

    { section: voices, label: t('nav.feed'), to: '/voices', icon: MessageSquare },
    { section: voices, label: t('nav.moderation'), to: '/feed-moderation', icon: ShieldCheck },
    { section: voices, label: t('nav.summaries'), to: '/summaries', icon: Newspaper },
    { section: voices, label: t('nav.actionItems'), to: '/action-items', icon: ListChecks },

    { section: surveys, label: t('nav.periods'), to: '/survey-periods', icon: Wrench },
    // HR are employees too: they answer the same anonymous survey.
    { section: surveys, label: t('nav.mySurveys'), to: '/survey', icon: FileEdit },

    { section: organization, label: t('nav.users'), to: '/users', icon: Users },
    { section: organization, label: t('departments.title'), to: '/departments', icon: Building2 },

    ...(auth.currentUser?.email?.trim().toLowerCase() === 'test@kmitl.ac.th'
      ? [{ section: system, label: t('modelTraining.title'), to: '/model-training', icon: BrainCircuit }]
      : []),
    // { section: system, label: t('nav.reports'), to: '/dashboard', icon: Upload },
    { section: system, label: t('nav.settings'), to: '/settings', icon: Settings },
  ]
})
</script>

<template>
  <div class="layout">
    <SidebarNav :items="items" variant="full" />
    <div class="main">
      <AppHeader :breadcrumb="breadcrumb" />
      <div class="content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.content {
  flex: 1;
  padding: var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 1440px;
  width: 100%;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .content {
    padding: var(--space-4);
  }
}
</style>
