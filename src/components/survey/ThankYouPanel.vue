<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Check } from '@lucide/vue'
import { Button } from '@/components/ui/button'

defineProps<{ nextRoundDate?: string }>()
const { t } = useI18n()
</script>

<template>
  <div class="thank-you">
    <div class="check">
      <Check :size="32" aria-hidden="true" />
    </div>
    <h1>{{ t('survey.thankYouTitle') }}</h1>
    <p>{{ t('survey.thankYouBody') }}</p>
    <p v-if="nextRoundDate" class="next-round">{{ t('survey.nextRound') }}: {{ nextRoundDate }}</p>
    <Button as-child variant="secondary" class="mt-3">
      <router-link to="/voices">{{ t('survey.viewLastSummary') }}</router-link>
    </Button>
  </div>
</template>

<style scoped>
.thank-you {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  text-align: center;
  padding: var(--space-7) var(--space-4);
}

.check {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border: 2px solid var(--color-primary);
  color: var(--color-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: pop 450ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes pop {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .check {
    animation: none;
  }
}

h1 {
  margin: 0;
  font-size: var(--font-size-xl);
}

p {
  margin: 0;
  color: var(--color-text-muted);
}

.next-round {
  font-weight: 600;
  color: var(--color-text);
}
</style>
