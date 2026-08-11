<script setup lang="ts">
import { useI18n } from 'vue-i18n'

defineProps<{ showBack: boolean; isLast: boolean; mobile?: boolean }>()
defineEmits<{ back: []; next: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="nav-buttons">
    <button v-if="showBack" type="button" class="back" @click="$emit('back')">
      {{ t('common.back') }}
    </button>
    <button type="button" class="next" @click="$emit('next')">
      {{ mobile ? `${isLast ? t('common.submit') : t('common.next')} →` : isLast ? t('common.submit') : t('common.next') }}
    </button>
  </div>
</template>

<style scoped>
.nav-buttons {
  display: flex;
  justify-content: space-between;
  gap: var(--space-3);
}

button {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}

.back {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.next {
  border: none;
  background: var(--color-primary);
  color: white;
  margin-left: auto;
}

.next:hover {
  background: var(--color-primary-hover);
}
</style>
