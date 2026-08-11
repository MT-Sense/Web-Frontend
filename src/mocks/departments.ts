import type { Department } from '@/types/department'

/** "ทีมนวัตกรรม" deliberately has respondentCount < 5 to exercise n<5 suppression UI. */
export const departments: Department[] = [
  { id: 'sales', name: { th: 'ฝ่ายขาย', en: 'Sales' }, respondentCount: 42 },
  { id: 'support', name: { th: 'ฝ่ายซัพพอร์ต', en: 'Support' }, respondentCount: 58 },
  { id: 'engineering', name: { th: 'ฝ่ายวิศวกรรม', en: 'Engineering' }, respondentCount: 76 },
  { id: 'product', name: { th: 'ฝ่ายผลิตภัณฑ์', en: 'Product' }, respondentCount: 31 },
  { id: 'hr', name: { th: 'ฝ่ายทรัพยากรบุคคล', en: 'HR' }, respondentCount: 12 },
  { id: 'finance', name: { th: 'ฝ่ายการเงิน', en: 'Finance' }, respondentCount: 19 },
  { id: 'marketing', name: { th: 'ฝ่ายการตลาด', en: 'Marketing' }, respondentCount: 24 },
  { id: 'innovation', name: { th: 'ทีมนวัตกรรม', en: 'Innovation Team' }, respondentCount: 3 },
]

export const tenureBuckets = [
  { bucket: '<1y', label: { th: '<1 ปี', en: '<1 yr' } },
  { bucket: '1-3y', label: { th: '1-3 ปี', en: '1-3 yr' } },
  { bucket: '3-5y', label: { th: '3-5 ปี', en: '3-5 yr' } },
  { bucket: '5y+', label: { th: '5 ปี+', en: '5+ yr' } },
]
