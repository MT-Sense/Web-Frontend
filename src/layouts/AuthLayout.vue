<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

const { locale, t } = useI18n()

function toggleLocale() {
  setLocale(locale.value === 'th' ? 'en' : 'th')
}
</script>

<template>
  <div class="auth-layout">
    <header class="header">
      <span class="app-name">{{ t('app.name') }}</span>
      <button type="button" class="lang-toggle" @click="toggleLocale">
        {{ locale === 'th' ? 'EN' : 'TH' }}
      </button>
    </header>
    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-name {
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.lang-toggle {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-1) var(--space-3);
  cursor: pointer;
  font-weight: 600;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}
</style>
