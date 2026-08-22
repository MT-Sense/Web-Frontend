<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, ChevronUp } from '@lucide/vue'
import type { FeedPost } from '@/types/feedPost'

const props = defineProps<{ post: FeedPost }>()
const { t } = useI18n()

const netVotes = computed(() => props.post.upvotes - props.post.downvotes)

const fontSize = computed(() => {
  const min = 13
  const max = 20
  const ratio = Math.min(props.post.upvotes / 150, 1)
  return `${min + ratio * (max - min)}px`
})
</script>

<template>
  <article class="feed-post panel">
    <div class="votes">
      <button type="button" class="arrow" aria-label="upvote">
        <ChevronUp :size="16" aria-hidden="true" />
      </button>
      <span class="count">{{ netVotes }}</span>
      <button type="button" class="arrow" aria-label="downvote">
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
