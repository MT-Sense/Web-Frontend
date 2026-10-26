<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Check, EyeOff, MessageSquareReply, X } from '@lucide/vue'
import HrLayout from '@/layouts/HrLayout.vue'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAsyncData } from '@/composables/useAsyncData'
import { useToast } from '@/composables/useToast'
import * as feedApi from '@/api/feed'
import type { FeedPost } from '@/types/feedPost'
import type { Locale, LocalizedText } from '@/types/common'

const MAX_REPLY = 2000

const { t, locale } = useI18n()
const { toast } = useToast()

const pending = useAsyncData(() => feedApi.pendingModeration())
const published = useAsyncData(() => feedApi.list({ sort: 'newest', limit: 100 }))

const actionItems = useAsyncData(() => feedApi.actionItems())
const actionLabel = (item: { topic: LocalizedText }) => item.topic[locale.value as Locale] || item.topic.th

const busyId = ref<string | null>(null)
/** Open reply editors, keyed by post id: the reply text and the linked action item ("" = none). */
const drafts = reactive<Record<string, string>>({})
const links = reactive<Record<string, string>>({})

function openReply(post: FeedPost) {
  drafts[post.id] = post.hrReply
  links[post.id] = post.actionItem?.id ?? ''
}

function closeReply(post: FeedPost) {
  delete drafts[post.id]
  delete links[post.id]
}

function editorChanged(post: FeedPost) {
  return drafts[post.id] !== post.hrReply || links[post.id] !== (post.actionItem?.id ?? '')
}

async function moderate(post: FeedPost, payload: { published?: boolean; hrReply?: string; actionItemId?: string }, message: string) {
  if (busyId.value) return
  busyId.value = post.id
  try {
    await feedApi.moderate(post.id, payload)
    closeReply(post)
    toast.success(message)
    await Promise.all([pending.reload(), published.reload()])
  } catch (e) {
    toast.error(t('moderation.failed'), e instanceof Error ? e.message : String(e))
  } finally {
    busyId.value = null
  }
}

/** Publishing from the pending queue also saves a reply typed in the editor, if any. */
function publish(post: FeedPost) {
  const reply = drafts[post.id]?.trim()
  const link = links[post.id]
  moderate(
    post,
    { published: true, ...(reply ? { hrReply: reply } : {}), ...(link ? { actionItemId: link } : {}) },
    t('moderation.publishedToast'),
  )
}

function saveReply(post: FeedPost) {
  const reply = (drafts[post.id] ?? '').trim()
  moderate(post, { hrReply: reply, actionItemId: links[post.id] ?? '' }, reply ? t('moderation.replySaved') : t('moderation.replyRemoved'))
}
</script>

<template>
  <HrLayout :breadcrumb="t('nav.moderation')">
    <div class="moderation">
      <section class="panel">
        <h2>{{ t('moderation.pendingTitle') }}</h2>
        <p class="hint">{{ t('moderation.pendingHint') }}</p>

        <p v-if="pending.loading.value && !pending.data.value">{{ t('common.loading') }}</p>
        <Alert v-else-if="pending.error.value" variant="destructive">
          <AlertDescription>{{ t('common.loadError') }}</AlertDescription>
        </Alert>
        <p v-else-if="(pending.data.value ?? []).length === 0" class="empty">{{ t('moderation.pendingEmpty') }}</p>

        <ul v-else class="posts">
          <li v-for="post in pending.data.value" :key="post.id" class="post">
            <p class="post-text">{{ post.text }}</p>
            <p class="meta">
              <span v-for="tag in post.hashtags" :key="tag" class="tag">#{{ tag }}</span>
              <span>{{ post.createdAt }}</span>
            </p>

            <div v-if="post.id in drafts" class="reply-editor">
              {{ t('moderation.replyLabel') }} <span class="muted">({{ t('common.optional') }})</span>
              <textarea
                v-model="drafts[post.id]"
                :aria-label="t('moderation.replyLabel')"
                rows="3"
                :maxlength="MAX_REPLY"
                :placeholder="t('moderation.replyPlaceholder')"
                :disabled="busyId === post.id"
              />
              <span class="hint">{{ t('moderation.replyPublicHint') }}</span>
              <label class="link-picker">
                {{ t('moderation.linkActionItem') }} <span class="muted">({{ t('common.optional') }})</span>
                <select v-model="links[post.id]" :disabled="busyId === post.id">
                  <option value="">{{ t('moderation.noActionItem') }}</option>
                  <option v-for="item in actionItems.data.value ?? []" :key="item.id" :value="item.id">
                    {{ actionLabel(item) }} · {{ item.status === 'done' ? t('feed.actionsDone') : t('feed.actionsInProgress') }}<template v-if="item.assignee"> · {{ item.assignee }}</template>
                  </option>
                </select>
                <RouterLink to="/action-items" class="hint">{{ t('moderation.manageActionItems') }}</RouterLink>
              </label>
            </div>

            <div class="actions">
              <Button size="sm" :disabled="busyId === post.id" @click="publish(post)">
                <Check :size="14" aria-hidden="true" />
                {{ drafts[post.id]?.trim() ? t('moderation.publishWithReply') : t('moderation.publish') }}
              </Button>
              <Button v-if="!(post.id in drafts)" size="sm" variant="secondary" :disabled="busyId === post.id" @click="openReply(post)">
                <MessageSquareReply :size="14" aria-hidden="true" />
                {{ t('moderation.addReply') }}
              </Button>
              <Button size="sm" variant="secondary" :disabled="busyId === post.id" @click="moderate(post, { published: false }, t('moderation.rejectedToast'))">
                <X :size="14" aria-hidden="true" />
                {{ t('moderation.reject') }}
              </Button>
            </div>
          </li>
        </ul>
      </section>

      <section class="panel">
        <h2>{{ t('moderation.publishedTitle') }}</h2>
        <p v-if="published.loading.value && !published.data.value">{{ t('common.loading') }}</p>
        <Alert v-else-if="published.error.value" variant="destructive">
          <AlertDescription>{{ t('common.loadError') }}</AlertDescription>
        </Alert>
        <p v-else-if="(published.data.value?.posts ?? []).length === 0" class="empty">{{ t('moderation.publishedEmpty') }}</p>

        <ul v-else class="posts">
          <li v-for="post in published.data.value?.posts" :key="post.id" class="post">
            <p class="post-text">{{ post.text }}</p>
            <p class="meta">
              <span v-for="tag in post.hashtags" :key="tag" class="tag">#{{ tag }}</span>
              <span>{{ post.createdAt }}</span>
              <span>▲ {{ post.upvotes }} · ▼ {{ post.downvotes }}</span>
            </p>

            <div v-if="post.hrReply && !(post.id in drafts)" class="reply">
              <span class="reply-label">{{ t('feed.hrReplyHeading') }}<template v-if="post.hrRepliedAt"> · {{ post.hrRepliedAt }}</template></span>
              <p>{{ post.hrReply }}</p>
            </div>
            <p v-if="post.actionItem && !(post.id in drafts)" class="linked">
              {{ t('moderation.linkedTo') }}: {{ actionLabel(post.actionItem) }} · {{ post.actionItem.status === 'done' ? t('feed.actionsDone') : t('feed.actionsInProgress') }}
            </p>
            <p v-else-if="post.hrReplied && !post.hrReply && !(post.id in drafts)" class="muted legacy">
              {{ t('moderation.legacyReplied') }}
            </p>

            <div v-if="post.id in drafts" class="reply-editor">
              {{ t('moderation.replyLabel') }}
              <textarea
                v-model="drafts[post.id]"
                :aria-label="t('moderation.replyLabel')"
                rows="3"
                :maxlength="MAX_REPLY"
                :placeholder="t('moderation.replyPlaceholder')"
                :disabled="busyId === post.id"
              />
              <span class="hint">{{ t('moderation.replyPublicHint') }}</span>
              <label class="link-picker">
                {{ t('moderation.linkActionItem') }} <span class="muted">({{ t('common.optional') }})</span>
                <select v-model="links[post.id]" :disabled="busyId === post.id">
                  <option value="">{{ t('moderation.noActionItem') }}</option>
                  <option v-for="item in actionItems.data.value ?? []" :key="item.id" :value="item.id">
                    {{ actionLabel(item) }} · {{ item.status === 'done' ? t('feed.actionsDone') : t('feed.actionsInProgress') }}<template v-if="item.assignee"> · {{ item.assignee }}</template>
                  </option>
                </select>
                <RouterLink to="/action-items" class="hint">{{ t('moderation.manageActionItems') }}</RouterLink>
              </label>
            </div>

            <div class="actions">
              <template v-if="post.id in drafts">
                <Button size="sm" :disabled="busyId === post.id || !editorChanged(post)" @click="saveReply(post)">
                  {{ (drafts[post.id] ?? '').trim() ? t('moderation.saveReply') : t('moderation.removeReply') }}
                </Button>
                <Button size="sm" variant="secondary" :disabled="busyId === post.id" @click="closeReply(post)">
                  {{ t('common.cancel') }}
                </Button>
              </template>
              <template v-else>
                <Button size="sm" variant="secondary" :disabled="busyId === post.id" @click="openReply(post)">
                  <MessageSquareReply :size="14" aria-hidden="true" />
                  {{ post.hrReply ? t('moderation.editReply') : t('moderation.addReply') }}
                </Button>
                <Button size="sm" variant="secondary" :disabled="busyId === post.id" @click="moderate(post, { published: false }, t('moderation.unpublishedToast'))">
                  <EyeOff :size="14" aria-hidden="true" />
                  {{ t('moderation.unpublish') }}
                </Button>
              </template>
            </div>
          </li>
        </ul>
      </section>
    </div>
  </HrLayout>
</template>

<style scoped>
.moderation {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 820px;
}

.panel h2 {
  margin: 0 0 var(--space-2);
  font-size: var(--font-size-md);
  font-weight: 600;
}

.hint,
.empty {
  margin: 0 0 var(--space-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.posts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--space-3);
}

.post {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-3);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.post-text {
  margin: 0;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.meta {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.tag {
  color: var(--color-accent-700);
}

.reply {
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid var(--color-positive);
  background: var(--color-positive-bg);
  border-radius: var(--radius-md);
}

.reply-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-positive);
}

.reply p {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.link-picker {
  display: grid;
  gap: var(--space-1);
  margin-top: var(--space-2);
}

.link-picker select {
  height: 36px;
  max-width: 420px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  padding: 0 var(--space-2);
  font: inherit;
  font-weight: 400;
}

.link-picker a {
  font-weight: 400;
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.linked {
  margin: 0;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.reply-editor {
  display: grid;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.reply-editor .hint {
  margin: 0;
  font-weight: 400;
  font-size: var(--font-size-xs);
}

.reply-editor textarea {
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

.legacy {
  margin: 0;
  font-size: var(--font-size-xs);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
