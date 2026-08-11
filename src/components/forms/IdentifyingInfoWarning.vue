<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <p class="warning">⚠️ {{ t('formBuilder.identifyingWarning') }}</p>
</template>

<style scoped>
.warning {
  margin: 0;
  color: var(--color-negative);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
</style>
