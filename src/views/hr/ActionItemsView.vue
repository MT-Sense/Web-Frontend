<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRoleLayout } from '@/composables/useRoleLayout'
import ActionItemsManager from '@/components/dashboard/ActionItemsManager.vue'

// Shared by HR and executives; the layout follows the signed-in role.
const { t } = useI18n()
const { layoutComponent } = useRoleLayout()
</script>

<template>
  <component :is="layoutComponent" :breadcrumb="t('nav.actionItems')">
    <div class="page">
      <ActionItemsManager />
    </div>
  </component>
</template>

<style scoped>
.page {
  max-width: 900px;
}
</style>
