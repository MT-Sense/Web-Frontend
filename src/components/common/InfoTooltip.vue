<script setup lang="ts">
import { Info } from '@lucide/vue'
import { useI18n } from 'vue-i18n'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

withDefaults(defineProps<{
  text: string
  label: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}>(), { side: 'top' })

const { t } = useI18n()
</script>

<template>
  <TooltipProvider :delay-duration="200">
    <Tooltip>
      <TooltipTrigger as-child>
        <button
          type="button"
          class="info-trigger"
          :aria-label="t('common.infoAbout', { title: label })"
        >
          <Info :size="16" aria-hidden="true" />
        </button>
      </TooltipTrigger>
      <TooltipContent
        :side="side"
        class="whitespace-pre-line text-left leading-relaxed motion-reduce:animate-none motion-reduce:transition-none"
        :style="{ maxWidth: 'min(40ch, calc(100vw - var(--space-6)))' }"
      >
        {{ text }}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</template>

<style scoped>
.info-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  flex-shrink: 0;
  padding: var(--space-1);
  margin-inline-start: var(--space-1);
  border: 0;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  line-height: 1;
  cursor: help;
}

.info-trigger:hover,
.info-trigger:focus-visible {
  color: var(--color-primary);
  background: var(--color-primary-bg);
}

.info-trigger:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
</style>
