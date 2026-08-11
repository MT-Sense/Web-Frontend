<script setup lang="ts">
import { computed } from 'vue'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { surveys } from '@/mocks/surveys'
import ThankYouPanel from '@/components/survey/ThankYouPanel.vue'

const props = defineProps<{ id: string }>()
const { layoutComponent } = useRoleLayout()

const survey = computed(() => surveys[props.id])
</script>

<template>
  <component :is="layoutComponent" hide-sidebar>
    <ThankYouPanel v-if="survey" :survey="survey" />
  </component>
</template>
