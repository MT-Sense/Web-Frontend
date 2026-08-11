import type { AiInsight, UrgentIssue, DecisionItem, WordCloudTerm } from '@/types/insight'

// mock AI output — replace with real pipeline in backend pass
export const aiInsight: AiInsight = {
  overallScore: 78,
  confidence: 'high',
  summary: {
    th: 'ความพึงพอใจโดยรวมปรับตัวดีขึ้นต่อเนื่อง 3 เดือน แต่ภาระงานในฝ่ายซัพพอร์ตยังเป็นประเด็นเร่งด่วนที่ควรติดตาม',
    en: 'Overall satisfaction has improved for 3 consecutive months, but workload in the Support department remains an urgent issue to monitor.',
  },
  issueConfidence: [
    { label: { th: 'ภาระงาน', en: 'Workload' }, confidence: 88 },
    { label: { th: 'เส้นทางเติบโต', en: 'Growth path' }, confidence: 71 },
    { label: { th: 'การสื่อสารนโยบาย', en: 'Policy communication' }, confidence: 64 },
  ],
}

export const urgentIssues: UrgentIssue[] = [
  {
    id: 'u1',
    label: { th: 'ภาระงาน', en: 'Workload' },
    departmentName: { th: 'ฝ่ายซัพพอร์ต', en: 'Support' },
  },
  {
    id: 'u2',
    label: { th: 'คนไม่พอในกะดึก', en: 'Understaffed night shift' },
    departmentName: { th: 'ฝ่ายซัพพอร์ต', en: 'Support' },
  },
  {
    id: 'u3',
    label: { th: 'เส้นทางเติบโตไม่ชัดเจน', en: 'Unclear growth path' },
    departmentName: { th: 'ฝ่ายการตลาด', en: 'Marketing' },
  },
]

export const decisionItems: DecisionItem[] = [
  { id: 'd1', rank: 1, label: { th: 'ภาระงาน ฝ่ายซัพพอร์ต', en: 'Support workload' }, severity: 92 },
  { id: 'd2', rank: 2, label: { th: 'เส้นทางเติบโต', en: 'Growth path' }, severity: 74 },
  {
    id: 'd3',
    rank: 3,
    label: { th: 'การสื่อสารนโยบาย', en: 'Policy communication' },
    severity: 58,
  },
]

export const wordCloud: WordCloudTerm[] = [
  { term: { th: 'ภาระงาน', en: 'workload' }, frequency: 96, topicId: 'work' },
  { term: { th: 'หัวหน้าทีม', en: 'team lead' }, frequency: 72, topicId: 'manager' },
  { term: { th: 'สวัสดิการ', en: 'benefits' }, frequency: 65, topicId: 'benefits' },
  { term: { th: 'เติบโต', en: 'growth' }, frequency: 58, topicId: 'growth' },
  { term: { th: 'ค่าตอบแทน', en: 'compensation' }, frequency: 54, topicId: 'compensation' },
  { term: { th: 'บรรยากาศทีม', en: 'team culture' }, frequency: 48, topicId: 'team' },
  { term: { th: 'กะดึก', en: 'night shift' }, frequency: 39, topicId: 'work' },
  { term: { th: 'การสื่อสาร', en: 'communication' }, frequency: 33, topicId: 'manager' },
  { term: { th: 'OT', en: 'overtime' }, frequency: 29, topicId: 'work' },
  { term: { th: 'ฝึกอบรม', en: 'training' }, frequency: 22, topicId: 'growth' },
]
