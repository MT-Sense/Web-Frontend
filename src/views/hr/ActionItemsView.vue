<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { ArrowLeft } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { useI18n } from 'vue-i18n'
import { useRoleLayout } from '@/composables/useRoleLayout'
import ActionItemsManager from '@/components/dashboard/ActionItemsManager.vue'

// Shared by HR and executives; the layout follows the signed-in role.
const { t } = useI18n()
const route = useRoute()
const topicId = computed(() =>
  typeof route.query.topic === 'string' ? route.query.topic : undefined,
)
const topicTarget = computed(() => {
  const query = { ...route.query }
  delete query.topic
  return { path: `/dashboard/topics/${encodeURIComponent(topicId.value ?? '')}`, query }
})
const { layoutComponent } = useRoleLayout()
</script>

<template>
  <component :is="layoutComponent" :breadcrumb="t('nav.actionItems')">
    <div class="page">
      <template v-if="topicId">
        <Button variant="secondary" as-child
          ><RouterLink :to="topicTarget"
            ><ArrowLeft :size="16" aria-hidden="true" />{{ t('drilldown.title') }}</RouterLink
          ></Button
        >
        <p class="scope-hint">{{ t('drilldown.actionsHelp') }}</p>
      </template>
      <ActionItemsManager :topic-id="topicId" />
    </div>
  </component>
</template>

<style scoped>
.scope-hint {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  margin: 0;
}
.page {
  display: grid;
  gap: var(--space-4);
  max-width: 900px;
}
</style>
