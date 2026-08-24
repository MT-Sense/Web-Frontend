<script setup lang="ts">
import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useRoleLayout } from '@/composables/useRoleLayout'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import FeedPostCard from '@/components/feed/FeedPostCard.vue'
import FeedFilterTabs from '@/components/feed/FeedFilterTabs.vue'
import PublishedSummarySidebar from '@/components/feed/PublishedSummarySidebar.vue'
import ActionItemsSidebar from '@/components/feed/ActionItemsSidebar.vue'
import { useAsyncData } from '@/composables/useAsyncData'
import * as feedApi from '@/api/feed'
import * as dashboardApi from '@/api/dashboard'
import type { FeedPost } from '@/types/feedPost'

const { t } = useI18n()
const { layoutComponent } = useRoleLayout()
const route = useRoute()

const { data: topicList } = useAsyncData(() => dashboardApi.topics())
const { data: summaries } = useAsyncData(() => feedApi.summaries())
const { data: actionItems } = useAsyncData(() => feedApi.actionItems())

const activeFilter = ref('popular')
const pageLimit = ref(3)
const allHashtags = ref<string[]>([])
const posts = ref<FeedPost[]>([])
const loading = ref(true)
const error = ref(false)

async function loadTagUniverse() {
  const res = await feedApi.list({ sort: 'popular', limit: 100 })
  allHashtags.value = [...new Set(res.posts.flatMap((p) => p.hashtags))]
}

async function loadPosts() {
  loading.value = true
  error.value = false
  try {
    const isTag = activeFilter.value !== 'popular' && activeFilter.value !== 'newest'
    const res = await feedApi.list({
      tag: isTag ? activeFilter.value : undefined,
      sort: isTag ? undefined : (activeFilter.value as 'popular' | 'newest'),
      limit: pageLimit.value,
    })
    posts.value = res.posts
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
}

onMounted(loadTagUniverse)
watch([activeFilter, pageLimit], loadPosts, { immediate: true })

watchEffect(() => {
  const tagParam = route.query.tag
  if (typeof tagParam === 'string' && topicList.value) {
    const topic = topicList.value.find((t2) => t2.id === tagParam)
    const label = topic ? topic.label.th : tagParam
    if (allHashtags.value.includes(label)) activeFilter.value = label
  }
})

const hasMore = computed(() => posts.value.length >= pageLimit.value)

function loadMore() {
  pageLimit.value += 3
}

function handleVoted(updated: FeedPost) {
  const index = posts.value.findIndex((p) => p.id === updated.id)
  if (index !== -1) posts.value[index] = updated
}
</script>

<template>
  <component :is="layoutComponent" :breadcrumb="t('nav.voices')">
    <div class="feed-layout">
      <div class="feed-main">
        <FeedFilterTabs v-model="activeFilter" :hashtags="allHashtags" />

        <Alert v-if="error" variant="destructive">
          <AlertDescription>
            {{ t('common.loadError') }}
            <Button variant="link" size="sm" @click="loadPosts">{{ t('common.retry') }}</Button>
          </AlertDescription>
        </Alert>
        <p v-else-if="loading && posts.length === 0">{{ t('common.loading') }}</p>

        <div class="posts">
          <FeedPostCard v-for="post in posts" :key="post.id" :post="post" @voted="handleVoted" />
        </div>
        <Button v-if="hasMore" variant="secondary" class="load-more" @click="loadMore">
          {{ t('common.loadMore') }}
        </Button>
        <p class="footer-note">{{ t('feed.footerNote') }}</p>
      </div>
      <aside class="feed-sidebar">
        <PublishedSummarySidebar :summaries="summaries ?? []" />
        <ActionItemsSidebar :items="actionItems ?? []" />
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

@media (max-width: 1100px) {
  .feed-layout {
    grid-template-columns: 1fr 280px;
  }
}

@media (max-width: 900px) {
  .feed-layout {
    grid-template-columns: 1fr;
  }
}
</style>
