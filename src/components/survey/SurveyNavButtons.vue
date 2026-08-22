<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ArrowLeft, ArrowRight } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps<{ showBack: boolean; isLast: boolean; mobile?: boolean }>()
defineEmits<{ back: []; next: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="nav-buttons">
    <Button v-if="showBack" variant="secondary" size="lg" @click="$emit('back')">
      <ArrowLeft :size="16" aria-hidden="true" />
      {{ t('common.back') }}
    </Button>
    <Button class="next" size="lg" @click="$emit('next')">
      {{ isLast ? t('common.submit') : t('common.next') }}
      <ArrowRight :size="16" aria-hidden="true" />
    </Button>
  </div>
</template>

<style scoped>
.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

.next {
  margin-left: auto;
}
</style>
