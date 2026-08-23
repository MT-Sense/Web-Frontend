<script setup lang="ts">
import { useRoleLayout } from '@/composables/useRoleLayout'
import ThankYouPanel from '@/components/survey/ThankYouPanel.vue'

const { layoutComponent } = useRoleLayout()
</script>

<template>
  <component :is="layoutComponent" hide-sidebar>
    <ThankYouPanel />
  </component>
</template>
