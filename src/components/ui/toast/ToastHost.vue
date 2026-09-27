<script setup lang="ts">
import { CircleAlert, CircleCheck, Info, X } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import { dismissToast, toasts } from '@/composables/useToast'

const { t } = useI18n()
</script>

<template>
  <Teleport to="body">
    <div class="toast-region" :aria-label="t('toast.region')" aria-live="polite">
      <TransitionGroup name="toast">
        <section v-for="item in toasts" :key="item.id" class="toast-item" :class="item.type" :role="item.type === 'error' ? 'alert' : 'status'">
          <CircleCheck v-if="item.type === 'success'" class="toast-icon" :size="21" aria-hidden="true" />
          <CircleAlert v-else-if="item.type === 'error'" class="toast-icon" :size="21" aria-hidden="true" />
          <Info v-else class="toast-icon" :size="21" aria-hidden="true" />
          <div class="toast-copy">
            <strong>{{ item.title }}</strong>
            <p v-if="item.description">{{ item.description }}</p>
          </div>
          <button type="button" class="toast-close" :aria-label="t('toast.close')" @click="dismissToast(item.id)">
            <X :size="18" aria-hidden="true" />
          </button>
        </section>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-region { position: fixed; top: 20px; right: 20px; z-index: 1000; display: grid; gap: 10px; width: min(420px, calc(100vw - 32px)); pointer-events: none; }
.toast-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: 12px; align-items: start; padding: 14px 16px; border: 1px solid var(--color-border); border-left: 4px solid var(--color-primary); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text); box-shadow: var(--shadow-lg); pointer-events: auto; }
.toast-item.success { border-left-color: var(--color-positive); }
.toast-item.error { border-left-color: var(--color-danger); }
.toast-icon { margin-top: 1px; color: var(--color-primary); }
.success .toast-icon { color: var(--color-positive); }
.error .toast-icon { color: var(--color-danger); }
.toast-copy { display: grid; gap: 4px; min-width: 0; }
.toast-copy strong { font-size: var(--font-size-sm); }
.toast-copy p { margin: 0; color: var(--color-text-muted); font-size: var(--font-size-sm); line-height: 1.5; white-space: pre-line; overflow-wrap: anywhere; }
.toast-close { display: grid; place-items: center; padding: 2px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--color-text-muted); cursor: pointer; }
.toast-close:hover { background: var(--color-primary-bg); color: var(--color-text); }
.toast-enter-active, .toast-leave-active { transition: opacity .18s ease, transform .18s ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px); }
@media (max-width: 600px) { .toast-region { top: 12px; right: 16px; } }
</style>
