import type { Suppressible } from '@/types/common'
import { suppressed, visible } from '@/types/common'
import { departments } from './departments'
import { topics } from './topics'

/** Raw scores, keyed by "deptId:topicId" — never exported directly.
 * Access must go through getVisibleDepartmentScore() so n<5 suppression
 * can't be bypassed by reaching into the raw matrix. Mock-layer enforcement
 * only; must move server-side in the backend pass. */
const rawScores: Record<string, number> = {
  'sales:work': 3.8,
  'sales:team': 4.1,
  'sales:manager': 3.6,
  'sales:compensation': 3.2,
  'sales:growth': 3.4,
  'sales:benefits': 3.9,
  'support:work': 2.6,
  'support:team': 3.3,
  'support:manager': 3.1,
  'support:compensation': 2.9,
  'support:growth': 2.7,
  'support:benefits': 3.5,
  'engineering:work': 3.9,
  'engineering:team': 4.2,
  'engineering:manager': 4.0,
  'engineering:compensation': 3.8,
  'engineering:growth': 3.6,
  'engineering:benefits': 4.0,
  'product:work': 3.7,
  'product:team': 3.9,
  'product:manager': 3.5,
  'product:compensation': 3.3,
  'product:growth': 3.8,
  'product:benefits': 3.7,
  'hr:work': 4.0,
  'hr:team': 4.3,
  'hr:manager': 4.1,
  'hr:compensation': 3.6,
  'hr:growth': 3.5,
  'hr:benefits': 4.2,
  'finance:work': 3.6,
  'finance:team': 3.8,
  'finance:manager': 3.7,
  'finance:compensation': 3.4,
  'finance:growth': 3.2,
  'finance:benefits': 3.8,
  'marketing:work': 3.5,
  'marketing:team': 3.7,
  'marketing:manager': 3.4,
  'marketing:compensation': 3.1,
  'marketing:growth': 3.6,
  'marketing:benefits': 3.6,
  'innovation:work': 4.4,
  'innovation:team': 4.5,
  'innovation:manager': 4.2,
  'innovation:compensation': 3.9,
  'innovation:growth': 4.6,
  'innovation:benefits': 4.0,
}

export function getVisibleDepartmentScore(deptId: string, topicId: string): Suppressible<number> {
  const dept = departments.find((d) => d.id === deptId)
  if (!dept || dept.respondentCount < 5) return suppressed()
  const score = rawScores[`${deptId}:${topicId}`]
  return visible(score ?? 0)
}

export function getHeatmapMatrix() {
  return departments.map((dept) => ({
    department: dept,
    cells: topics.map((topic) => ({
      topicId: topic.id,
      score: getVisibleDepartmentScore(dept.id, topic.id),
    })),
  }))
}
