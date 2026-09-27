<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Bot, ChevronDown, MessageCircle, Send, X } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import * as knowledgeBaseApi from '@/api/knowledgeBase'

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text: string
  sources?: knowledgeBaseApi.KnowledgeSource[]
}

const { t, locale } = useI18n()

const open = ref(false)
const question = ref('')
const loading = ref(false)
const error = ref('')
const messages = ref<ChatMessage[]>([])
const messagesEl = ref<HTMLElement | null>(null)
let nextId = 1

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
}

function toggle() {
  open.value = !open.value
  if (open.value) void scrollToBottom()
}

async function submit() {
  const value = question.value.trim()
  if (!value || loading.value) return

  messages.value.push({ id: nextId++, role: 'user', text: value })
  question.value = ''
  loading.value = true
  error.value = ''
  void scrollToBottom()

  try {
    const result = await knowledgeBaseApi.ask(value, locale.value === 'en' ? 'en' : 'th')
    messages.value.push({
      id: nextId++,
      role: 'assistant',
      text: result.answer,
      sources: result.sources,
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : t('qa.failed')
  } finally {
    loading.value = false
    void scrollToBottom()
  }
}
</script>

<template>
  <div class="qa-widget">
    <Transition name="chat-window">
      <section v-if="open" class="qa-window" role="dialog" :aria-label="t('qa.title')">
        <header class="qa-header">
          <div class="qa-identity">
            <span class="qa-avatar" aria-hidden="true"><Bot :size="22" /></span>
            <div>
              <strong>{{ t('qa.title') }}</strong>
              <span>{{ t('qa.status') }}</span>
            </div>
          </div>
          <button class="icon-button" type="button" :aria-label="t('qa.close')" @click="open = false">
            <X :size="20" />
          </button>
        </header>

        <div ref="messagesEl" class="qa-messages" aria-live="polite">
          <div v-if="messages.length === 0" class="qa-welcome">
            <span class="qa-avatar qa-avatar-large" aria-hidden="true"><Bot :size="28" /></span>
            <h3>{{ t('qa.welcomeTitle') }}</h3>
            <p>{{ t('qa.welcomeBody') }}</p>
            <div class="suggestions">
              <button type="button" @click="question = t('qa.example1')">{{ t('qa.example1') }}</button>
              <button type="button" @click="question = t('qa.example2')">{{ t('qa.example2') }}</button>
            </div>
          </div>

          <div
            v-for="message in messages"
            :key="message.id"
            class="message-row"
            :class="'message-' + message.role"
          >
            <div v-if="message.role === 'assistant'" class="mini-avatar" aria-hidden="true">
              <Bot :size="16" />
            </div>
            <div class="message-bubble">
              <p>{{ message.text }}</p>
              <div v-if="message.sources?.length" class="message-sources">
                <span>{{ t('qa.sources') }}</span>
                <span v-for="source in message.sources" :key="source.periodId" class="source-chip">
                  [[{{ source.periodLabel }}]]
                </span>
              </div>
            </div>
          </div>

          <div v-if="loading" class="message-row message-assistant">
            <div class="mini-avatar" aria-hidden="true"><Bot :size="16" /></div>
            <div class="message-bubble typing-bubble"><span /><span /><span /></div>
          </div>

          <p v-if="error" class="qa-error">{{ error }}</p>
        </div>

        <footer class="qa-composer">
          <form @submit.prevent="submit">
            <textarea
              v-model="question"
              rows="1"
              maxlength="1200"
              :placeholder="t('qa.shortPlaceholder')"
              :aria-label="t('qa.shortPlaceholder')"
              :disabled="loading"
              @keydown.enter.exact.prevent="submit"
            />
            <Button class="send-button" type="submit" :disabled="!question.trim() || loading">
              <Send :size="17" aria-hidden="true" />
              <span class="visually-hidden">{{ t('qa.ask') }}</span>
            </Button>
          </form>
          <p>{{ t('qa.guardShort') }}</p>
        </footer>
      </section>
    </Transition>

    <button
      class="qa-launcher"
      type="button"
      :aria-label="open ? t('qa.close') : t('qa.open')"
      :aria-expanded="open"
      @click="toggle"
    >
      <ChevronDown v-if="open" :size="28" />
      <MessageCircle v-else :size="28" />
    </button>
  </div>
</template>

<style scoped>
.qa-widget {
  position: fixed;
  right: var(--space-5);
  bottom: var(--space-5);
  z-index: 70;
  pointer-events: none;
}

.qa-launcher,
.qa-window {
  pointer-events: auto;
}

.qa-launcher {
  width: 60px;
  height: 60px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--color-primary);
  color: var(--color-surface);
  box-shadow: var(--shadow-lg);
  cursor: pointer;
}

.qa-launcher:hover { background: var(--color-primary-hover); }

.qa-launcher:focus-visible,
.icon-button:focus-visible,
.suggestions button:focus-visible,
.send-button:focus-visible {
  outline: 2px solid var(--color-accent-600);
  outline-offset: 2px;
}

.qa-window {
  position: absolute;
  right: 0;
  bottom: calc(60px + var(--space-3));
  width: min(390px, calc(100vw - (var(--space-4) * 2)));
  height: min(620px, calc(100vh - 130px));
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
}

.qa-header {
  min-height: 72px;
  padding: var(--space-3) var(--space-4);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--color-border);
}

.qa-identity {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  min-width: 0;
}

.qa-identity div { display: grid; }
.qa-identity strong { font-size: var(--font-size-lg); }
.qa-identity span {
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.qa-avatar,
.mini-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.qa-avatar { width: 42px; height: 42px; }
.qa-avatar-large { width: 56px; height: 56px; }

.icon-button {
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}

.icon-button:hover {
  background: var(--color-primary-bg);
  color: var(--color-primary);
}

.qa-messages {
  min-height: 0;
  overflow-y: auto;
  padding: var(--space-4);
  background: var(--color-bg);
}

.qa-welcome {
  min-height: 100%;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: var(--space-3);
  text-align: center;
}

.qa-welcome h3,
.qa-welcome p { margin: 0; }

.qa-welcome p {
  max-width: 280px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
}

.suggestions {
  display: grid;
  gap: var(--space-2);
  width: 100%;
  margin-top: var(--space-2);
}

.suggestions button {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: var(--space-3);
  text-align: left;
  cursor: pointer;
}

.suggestions button:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.message-row {
  display: flex;
  align-items: flex-end;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
}

.message-user { justify-content: flex-end; }
.mini-avatar { width: 28px; height: 28px; }

.message-bubble {
  max-width: 82%;
  border-radius: var(--radius-lg);
  padding: var(--space-3);
  background: var(--color-surface);
  box-shadow: var(--shadow-sm);
}

.message-user .message-bubble {
  background: var(--color-primary);
  color: var(--color-surface);
  border-bottom-right-radius: var(--radius-sm);
}

.message-assistant .message-bubble { border-bottom-left-radius: var(--radius-sm); }

.message-bubble p {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message-sources {
  display: flex;
  gap: var(--space-1);
  flex-wrap: wrap;
  margin-top: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-xs);
}

.source-chip {
  border-radius: var(--radius-sm);
  background: var(--color-primary-bg);
  color: var(--color-primary);
  padding: 2px var(--space-2);
}

.typing-bubble {
  display: flex;
  gap: 5px;
  align-items: center;
  min-height: 38px;
}

.typing-bubble span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-subtle);
  animation: typing 900ms ease-in-out infinite;
}

.typing-bubble span:nth-child(2) { animation-delay: 120ms; }
.typing-bubble span:nth-child(3) { animation-delay: 240ms; }

.qa-error {
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-xs);
}

.qa-composer {
  padding: var(--space-3);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.qa-composer form {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: end;
  gap: var(--space-2);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-2);
}

.qa-composer textarea {
  width: 100%;
  min-height: 40px;
  max-height: 110px;
  resize: none;
  border: 0;
  background: transparent;
  color: var(--color-text);
  padding: var(--space-2);
  font: inherit;
}

.qa-composer textarea:focus-visible { outline: none; }

.send-button {
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: 50%;
}

.qa-composer > p {
  margin: var(--space-2) var(--space-1) 0;
  color: var(--color-text-subtle);
  font-size: var(--font-size-xs);
  text-align: center;
}

@keyframes typing {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.45; }
  30% { transform: translateY(-3px); opacity: 1; }
}

.chat-window-enter-active,
.chat-window-leave-active {
  transition: opacity 160ms ease, transform 160ms ease;
}

.chat-window-enter-from,
.chat-window-leave-to {
  opacity: 0;
  transform: translateY(8px) scale(0.98);
}

@media (max-width: 560px) {
  .qa-widget {
    right: var(--space-3);
    bottom: var(--space-3);
  }

  .qa-window {
    position: fixed;
    inset: var(--space-3);
    width: auto;
    height: auto;
    max-height: none;
    border-radius: var(--radius-xl);
  }

  .qa-launcher {
    width: 54px;
    height: 54px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chat-window-enter-active,
  .chat-window-leave-active,
  .typing-bubble span {
    transition: none;
    animation: none;
  }
}
</style>
