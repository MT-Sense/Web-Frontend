<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
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
  <article class="feed-post">
    <div class="votes">
      <span class="arrow">▲</span>
      <span class="count">{{ netVotes }}</span>
      <span class="arrow">▼</span>
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
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--space-4);
}

.votes {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  min-width: 32px;
}

.count {
  font-weight: 700;
  color: var(--color-text);
}

.arrow {
  cursor: pointer;
}

.body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-xs);
}

.anon-badge {
  background: var(--color-bg);
  color: var(--color-text-muted);
  font-weight: 700;
  padding: 2px var(--space-2);
  border-radius: 999px;
}

.date {
  color: var(--color-text-subtle);
}

.hr-replied {
  color: var(--color-positive);
  font-weight: 600;
}

.text {
  margin: 0;
  line-height: 1.5;
}

.hashtags {
  display: flex;
  gap: var(--space-2);
}

.hashtag {
  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: 600;
}
</style>
