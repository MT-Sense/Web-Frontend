import type { Topic } from '@/types/topic'

/** Single source of truth for the 6 dimensions used by both the HR heatmap columns
 * and the Executive radar chart axes. */
export const topics: Topic[] = [
  { id: 'work', label: { th: 'งาน', en: 'Work' } },
  { id: 'team', label: { th: 'ทีม', en: 'Team' } },
  { id: 'manager', label: { th: 'หัวหน้า', en: 'Manager' } },
  { id: 'compensation', label: { th: 'ค่าตอบแทน', en: 'Compensation' } },
  { id: 'growth', label: { th: 'เติบโต', en: 'Growth' } },
  { id: 'benefits', label: { th: 'สวัสดิการ', en: 'Benefits' } },
]
