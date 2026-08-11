<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { Locale } from '@/types/common'
import type { Topic } from '@/types/topic'
import type { Department } from '@/types/department'
import { getHeatmapMatrix } from '@/mocks/heatmap'
import EmptyOrSuppressed from '@/components/common/EmptyOrSuppressed.vue'

const props = defineProps<{ topics: Topic[] }>()
const emit = defineEmits<{ cellClick: [topicId: string, department: Department] }>()

const { locale } = useI18n()
const rows = getHeatmapMatrix()

function heatClass(score: number) {
  if (score >= 4.2) return 'heat-6'
  if (score >= 3.8) return 'heat-5'
  if (score >= 3.4) return 'heat-4'
  if (score >= 3.0) return 'heat-3'
  if (score >= 2.5) return 'heat-2'
  return 'heat-1'
}
</script>

<template>
  <div class="heatmap">
    <div class="grid" :style="{ gridTemplateColumns: `160px repeat(${props.topics.length}, 1fr)` }">
      <div class="corner" />
      <div v-for="topic in props.topics" :key="topic.id" class="col-header">
        {{ topic.label[locale as Locale] }}
      </div>

      <template v-for="row in rows" :key="row.department.id">
        <div class="row-header">{{ row.department.name[locale as Locale] }}</div>

        <template v-if="row.department.respondentCount < 5">
          <div class="suppressed-row" :style="{ gridColumn: `span ${props.topics.length}` }">
            <EmptyOrSuppressed />
          </div>
        </template>
        <template v-else>
          <button
            v-for="cell in row.cells"
            :key="cell.topicId"
            type="button"
            class="cell"
            :class="!cell.score.suppressed ? heatClass(cell.score.data) : ''"
            @click="emit('cellClick', cell.topicId, row.department)"
          >
            <span v-if="!cell.score.suppressed">{{ cell.score.data.toFixed(1) }}</span>
            <EmptyOrSuppressed v-else />
          </button>
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.heatmap {
  overflow-x: auto;
}

.grid {
  display: grid;
  gap: 4px;
  min-width: 640px;
}

.corner {
  background: transparent;
}

.col-header {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: var(--color-text-muted);
  text-align: center;
  padding: var(--space-2);
}

.row-header {
  font-size: var(--font-size-sm);
  font-weight: 600;
  display: flex;
  align-items: center;
  padding: var(--space-2);
}

.cell {
  border: none;
  border-radius: var(--radius-sm);
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  cursor: pointer;
  color: var(--color-text);
}

.cell.heat-1 {
  background: var(--heat-1);
}
.cell.heat-2 {
  background: var(--heat-2);
}
.cell.heat-3 {
  background: var(--heat-3);
  color: white;
}
.cell.heat-4 {
  background: var(--heat-4);
  color: white;
}
.cell.heat-5 {
  background: var(--heat-5);
  color: white;
}
.cell.heat-6 {
  background: var(--heat-6);
  color: white;
}

.suppressed-row {
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  height: 44px;
}
</style>
