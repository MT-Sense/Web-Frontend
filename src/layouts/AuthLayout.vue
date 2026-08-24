<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Languages } from '@lucide/vue'
import { setLocale } from '@/i18n'
import { Button } from '@/components/ui/button'

const { locale, t } = useI18n()

function toggleLocale() {
  setLocale(locale.value === 'th' ? 'en' : 'th')
}
</script>

<template>
  <div class="auth-layout">
    <header class="header">
      <span class="app-name">{{ t('app.name') }}</span>
      <Button variant="secondary" size="sm" @click="toggleLocale">
        <Languages :size="15" aria-hidden="true" />
        {{ locale === 'th' ? 'EN' : 'TH' }}
      </Button>
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
  background:
    radial-gradient(
      ellipse 80% 55% at 50% 0%,
      color-mix(in srgb, var(--color-accent-200) 45%, transparent),
      transparent 70%
    ),
    var(--color-bg);
}

.header {
  height: var(--header-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--space-5);
}

.app-name {
  font-weight: 700;
  font-size: var(--font-size-lg);
  letter-spacing: -0.015em;
}

.content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5) var(--space-4) var(--space-7);
}
</style>
