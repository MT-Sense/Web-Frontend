<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp, CircleCheck, LoaderCircle } from '@lucide/vue'
import type { FeedPost } from '@/types/feedPost'
import type { Locale } from '@/types/common'
import * as feedApi from '@/api/feed'
import { useToast } from '@/composables/useToast'

const props = defineProps<{ post: FeedPost }>()
const emit = defineEmits<{ voted: [post: FeedPost] }>()
const { t, locale } = useI18n()
const { toast } = useToast()

const voting = ref(false)

const netVotes = computed(() => props.post.upvotes - props.post.downvotes)

const fontSize = computed(() => {
  const min = 13
  const max = 20
  const ratio = Math.min(props.post.upvotes / 150, 1)
  return `${min + ratio * (max - min)}px`
})

/** Same direction again removes the vote; the other direction switches it. */
async function castVote(direction: 1 | -1) {
  if (voting.value) return
  voting.value = true
  try {
    const updated = await feedApi.vote(props.post.id, direction)
    emit('voted', updated)
  } catch (e) {
    toast.error(t('feed.voteFailed'), e instanceof Error ? e.message : String(e))
  } finally {
    voting.value = false
  }
}
</script>

<template>
  <article class="feed-post panel">
    <div class="votes">
      <button
        type="button"
        class="arrow"
        :class="{ 'voted-up': post.myVote === 1 }"
        :aria-label="t('feed.upvote')"
        :aria-pressed="post.myVote === 1"
        :title="post.myVote === 1 ? t('feed.undoVote') : t('feed.upvote')"
        :disabled="voting"
        @click="castVote(1)"
      >
        <ChevronUp :size="16" aria-hidden="true" />
      </button>
      <span class="count" :class="{ 'voted-up': post.myVote === 1, 'voted-down': post.myVote === -1 }">{{ netVotes }}</span>
      <button
        type="button"
        class="arrow"
        :class="{ 'voted-down': post.myVote === -1 }"
        :aria-label="t('feed.downvote')"
        :aria-pressed="post.myVote === -1"
        :title="post.myVote === -1 ? t('feed.undoVote') : t('feed.downvote')"
        :disabled="voting"
        @click="castVote(-1)"
      >
        <ChevronDown :size="16" aria-hidden="true" />
      </button>
    </div>
    <div class="body">
      <div class="meta">
        <span class="anon-badge">{{ t('feed.anonymous') }}</span>
        <span class="date">{{ post.createdAt }}</span>
        <span v-if="post.hrReplied" class="hr-replied">{{ t('feed.hrReplied') }}</span>
      </div>
      <p class="text" :style="{ fontSize }">{{ post.text }}</p>
      <div class="hashtags">
        <span v-for="tag in post.hashtags" :key="tag" class="hashtag">#{{ tag }}</span>
      </div>
      <div v-if="post.hrReply || post.actionItem" class="hr-reply">
        <template v-if="post.hrReply">
          <span class="hr-reply-label">
            {{ t('feed.hrReplyHeading') }}<template v-if="post.hrRepliedAt"> · {{ post.hrRepliedAt }}</template>
          </span>
          <p>{{ post.hrReply }}</p>
        </template>
        <p v-if="post.actionItem" class="action-link" :class="post.actionItem.status">
          <CircleCheck v-if="post.actionItem.status === 'done'" :size="14" aria-hidden="true" />
          <LoaderCircle v-else :size="14" aria-hidden="true" />
          <span>
            {{ post.actionItem.status === 'done' ? t('feed.linkedDone') : t('feed.linkedInProgress') }}:
            <strong>{{ post.actionItem.topic[locale as Locale] || post.actionItem.topic.th }}</strong>
            <template v-if="post.actionItem.status === 'done' && post.actionItem.doneAt"> · {{ post.actionItem.doneAt }}</template>
            <template v-else-if="post.actionItem.targetDate"> · {{ t('feed.actionTarget', { date: post.actionItem.targetDate }) }}</template>
          </span>
        </p>
      </div>
    </div>
  </article>
</template>

<style scoped>
.feed-post {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-4);
  transition:
    box-shadow 180ms ease,
    transform 180ms ease;
}

.feed-post:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.votes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  min-width: 34px;
}

.count {
  font-weight: 700;
  color: var(--color-text);
}

.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  padding: 2px;
  border-radius: var(--radius-sm);
  color: inherit;
  cursor: pointer;
  transition:
    color 150ms ease,
    background-color 150ms ease,
    transform 150ms ease;
}

.arrow:hover {
  color: var(--color-primary);
  background: var(--color-accent-100);
}

.arrow:active {
  transform: scale(0.9);
}

.arrow.voted-up,
.count.voted-up {
  color: var(--color-primary);
}

.arrow.voted-up {
  background: var(--color-accent-100);
}

.arrow.voted-down,
.count.voted-down {
  color: var(--color-danger);
}

.arrow:disabled {
  cursor: wait;
  opacity: 0.6;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  min-width: 0;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
}

.anon-badge {
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: 700;
  letter-spacing: 0.04em;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.date {
  color: var(--color-text-subtle);
}

.hr-replied {
  color: var(--color-positive);
  background: var(--color-positive-bg);
  font-weight: 600;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.hr-reply {
  padding: var(--space-2) var(--space-3);
  border-left: 3px solid var(--color-positive);
  background: var(--color-positive-bg);
  border-radius: var(--radius-md);
}

.hr-reply-label {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-positive);
}

.hr-reply .action-link {
  display: flex;
  align-items: flex-start;
  gap: var(--space-1);
  margin-top: var(--space-2);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.hr-reply .action-link svg {
  flex: none;
  margin-top: 2px;
  color: var(--color-neutral);
}

.hr-reply .action-link.done svg {
  color: var(--color-positive);
}

.hr-reply p:not(.action-link) {
  margin: var(--space-1) 0 0;
  font-size: var(--font-size-sm);
  line-height: 1.5;
  white-space: pre-line;
  overflow-wrap: anywhere;
}

.text {
  margin: 0;
  line-height: 1.55;
  overflow-wrap: anywhere;
}

.hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.hashtag {
  color: var(--color-accent-700);
  background: var(--color-accent-100);
  font-size: var(--font-size-xs);
  font-weight: 600;
  padding: 2px var(--space-2);
  border-radius: 999px;
}
</style>
