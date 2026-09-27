<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import HrLayout from '@/layouts/HrLayout.vue'
import AutomationSettingsPanel from '@/components/forms/AutomationSettingsPanel.vue'

const { t } = useI18n()
</script>

<template>
  <HrLayout :breadcrumb="t('automationSettings.breadcrumb')">
    <div class="assistant-settings-page">
      <RouterLink to="/settings">← {{ t('automationSettings.back') }}</RouterLink>
      <AutomationSettingsPanel />
    </div>
  </HrLayout>
</template>

<style scoped>
.assistant-settings-page {
  display: grid;
  gap: var(--space-4);
  width: min(100%, 920px);
}
.assistant-settings-page > a { color: var(--color-primary); justify-self: start; }
</style>
