<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Survey } from '@/types/survey'

defineProps<{ survey: Survey }>()
const { t } = useI18n()
</script>

<template>
  <div class="thank-you">
    <div class="check">✓</div>
    <h1>{{ t('survey.thankYouTitle') }}</h1>
    <p>{{ t('survey.thankYouBody') }}</p>
    <p class="next-round">{{ t('survey.nextRound') }}: {{ survey.nextRoundDate }}</p>
    <router-link to="/voices" class="link-btn">{{ t('survey.viewLastSummary') }}</router-link>
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
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-positive-bg);
  color: var(--color-positive);
  font-size: var(--font-size-xxl);
  display: flex;
  align-items: center;
  justify-content: center;
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

.link-btn {
  margin-top: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-5);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 600;
}

.link-btn:hover {
  background: var(--color-bg);
}
</style>
