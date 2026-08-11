<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRoleLayout } from '@/composables/useRoleLayout'
import FeedPostCard from '@/components/feed/FeedPostCard.vue'
import FeedFilterTabs from '@/components/feed/FeedFilterTabs.vue'
import PublishedSummarySidebar from '@/components/feed/PublishedSummarySidebar.vue'
import ActionItemsSidebar from '@/components/feed/ActionItemsSidebar.vue'
import { feedPosts } from '@/mocks/feed'
import { topics } from '@/mocks/topics'

const { t } = useI18n()
const { layoutComponent } = useRoleLayout()
const route = useRoute()

// Two-gate publish flow: only posts that both opted in and passed moderation render.
const visiblePosts = feedPosts.filter((p) => p.optedIn && p.published)

const allHashtags = [...new Set(visiblePosts.flatMap((p) => p.hashtags))]

const activeFilter = ref('popular')
const pageSize = ref(3)

watchEffect(() => {
  const tagParam = route.query.tag
  if (typeof tagParam === 'string') {
    const topic = topics.find((t2) => t2.id === tagParam)
    const label = topic ? topic.label.th : tagParam
    if (allHashtags.includes(label)) activeFilter.value = label
  }
})

const filteredPosts = computed(() => {
  let list = [...visiblePosts]
  if (activeFilter.value === 'popular') {
    list.sort((a, b) => b.upvotes - a.upvotes)
  } else if (activeFilter.value === 'newest') {
    list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
  } else {
    list = list.filter((p) => p.hashtags.includes(activeFilter.value))
  }
  return list.slice(0, pageSize.value)
})

const hasMore = computed(() => pageSize.value < visiblePosts.length)

function loadMore() {
  pageSize.value += 3
}
</script>

<template>
  <component :is="layoutComponent" :breadcrumb="t('nav.voices')">
    <div class="feed-layout">
      <div class="feed-main">
        <FeedFilterTabs v-model="activeFilter" :hashtags="allHashtags" />
        <div class="posts">
          <FeedPostCard v-for="post in filteredPosts" :key="post.id" :post="post" />
        </div>
        <button v-if="hasMore" type="button" class="load-more" @click="loadMore">
          {{ t('common.loadMore') }}
        </button>
        <p class="footer-note">{{ t('feed.footerNote') }}</p>
      </div>
      <aside class="feed-sidebar">
        <PublishedSummarySidebar />
        <ActionItemsSidebar />
      </aside>
    </div>
  </component>
</template>

<style scoped>
.feed-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: var(--space-4);
  align-items: start;
}

.feed-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.posts {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.load-more {
  align-self: center;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  padding: var(--space-2) var(--space-5);
  font-weight: 600;
  cursor: pointer;
}

.load-more:hover {
  background: var(--color-bg);
}

.footer-note {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-subtle);
}

.feed-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

@media (max-width: 900px) {
  .feed-layout {
    grid-template-columns: 1fr;
  }
}
</style>
