<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Mail } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import * as emailApi from '@/api/email'

const props = defineProps<{
  /** Period to summarize; the backend uses the latest one when omitted. */
  periodId?: string
  periodLabel?: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const auth = useAuthStore()
const { toast } = useToast()

const MAX_NOTE = 1000

const recipients = ref<emailApi.EmailRecipient[]>([])
const selected = ref<string[]>([])
const note = ref('')
const loading = ref(false)
const sending = ref(false)
const error = ref('')

async function loadRecipients() {
  loading.value = true
  error.value = ''
  try {
    recipients.value = await emailApi.recipients()
    // Preselect everyone except yourself — the usual case is "share with the other leaders".
    selected.value = recipients.value.filter((r) => r.id !== auth.currentUser?.id).map((r) => r.id)
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    note.value = ''
    loadRecipients()
  }
})

function toggle(id: string, checked: boolean | 'indeterminate') {
  selected.value = checked === true
    ? [...selected.value, id]
    : selected.value.filter((value) => value !== id)
}

const canSend = computed(() => selected.value.length > 0 && !sending.value && note.value.length <= MAX_NOTE)

async function send() {
  if (!canSend.value) return
  sending.value = true
  error.value = ''
  try {
    const { queued } = await emailApi.sendSummary({
      periodId: props.periodId || undefined,
      recipientIds: selected.value,
      note: note.value.trim() || undefined,
    })
    toast.success(t('email.summaryQueued', { count: queued }), t('email.summaryQueuedDetail'))
    open.value = false
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="send-summary">
      <DialogHeader>
        <DialogTitle>{{ t('email.summaryTitle') }}</DialogTitle>
        <DialogDescription>
          {{ periodLabel ? t('email.summaryDescriptionPeriod', { period: periodLabel }) : t('email.summaryDescription') }}
        </DialogDescription>
      </DialogHeader>

      <fieldset class="recipients" :disabled="sending">
        <legend>{{ t('email.recipients') }}</legend>
        <p v-if="loading" class="muted">{{ t('common.loading') }}</p>
        <p v-else-if="recipients.length === 0 && !error" class="muted">{{ t('email.noRecipients') }}</p>
        <label v-for="person in recipients" :key="person.id" class="recipient">
          <Checkbox
            :model-value="selected.includes(person.id)"
            @update:model-value="(value) => toggle(person.id, value)"
          />
          <span class="recipient-name">
            {{ person.fullName || person.email }}
            <span class="muted">· {{ t(`role.${person.role}`) }}<template v-if="person.id === auth.currentUser?.id"> · {{ t('email.you') }}</template></span>
          </span>
          <span class="recipient-email muted">{{ person.email }}</span>
        </label>
      </fieldset>

      <label class="note">
        {{ t('email.note') }} <span class="muted">({{ t('common.optional') }})</span>
        <textarea
          v-model="note"
          rows="3"
          :maxlength="MAX_NOTE"
          :placeholder="t('email.notePlaceholder')"
          :disabled="sending"
        />
      </label>

      <p class="privacy-note">{{ t('email.aggregatesOnly') }}</p>
      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <DialogFooter>
        <Button variant="secondary" :disabled="sending" @click="open = false">{{ t('common.cancel') }}</Button>
        <Button :disabled="!canSend" @click="send">
          <Mail :size="16" aria-hidden="true" />
          {{ sending ? t('email.sending') : t('email.sendTo', { count: selected.length }) }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.recipients {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  border: 0;
  max-height: 240px;
  overflow-y: auto;
}

.recipients legend {
  margin-bottom: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.recipient {
  display: grid;
  grid-template-columns: auto 1fr;
  column-gap: var(--space-3);
  align-items: center;
  font-size: var(--font-size-sm);
  cursor: pointer;
}

.recipient-email {
  grid-column: 2;
  font-size: var(--font-size-xs);
  overflow-wrap: anywhere;
}

.note {
  display: grid;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.note textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-2) var(--space-3);
  font: inherit;
  font-weight: 400;
}

.muted {
  color: var(--color-text-subtle);
  font-weight: 400;
}

.privacy-note {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.error {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-danger);
}
</style>
