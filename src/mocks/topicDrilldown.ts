import type { TopicDrilldown } from '@/types/topic'

// mock AI output — replace with real pipeline in backend pass
export const topicDrilldowns: Record<string, TopicDrilldown> = {
  work: {
    topicId: 'work',
    score: 3.4,
    companyAverage: 3.7,
    respondentCount: 612,
    percentageTagged: 41,
    trend: [
      { month: '2026-03', score: 3.6 },
      { month: '2026-04', score: 3.5 },
      { month: '2026-05', score: 3.5 },
      { month: '2026-06', score: 3.4 },
      { month: '2026-07', score: 3.3 },
      { month: '2026-08', score: 3.4 },
    ],
    subIssues: [
      { id: 's1', label: { th: 'งานเข้าไม่สม่ำเสมอ', en: 'Inconsistent workload' }, percentage: 38 },
      { id: 's2', label: { th: 'คนไม่พอในกะดึก', en: 'Understaffed night shift' }, percentage: 29 },
      { id: 's3', label: { th: 'OT บ่อยเกินไป', en: 'Excessive overtime' }, percentage: 22 },
    ],
    sentiment: { positive: 31, neutral: 34, negative: 35 },
    sampleQuotes: [
      'ช่วงสิ้นเดือนงานจะเยอะมากจนแทบไม่มีเวลาพัก อยากให้กระจายงานให้สม่ำเสมอกว่านี้',
      'กะดึกมีคนน้อยเกินไป บางคืนต้องรับงานคนเดียวหลายส่วน',
      'ภาพรวมงานโอเค แต่บางสัปดาห์ OT เยอะจนกระทบชีวิตส่วนตัว',
    ],
  },
  manager: {
    topicId: 'manager',
    score: 3.7,
    companyAverage: 3.7,
    respondentCount: 588,
    percentageTagged: 26,
    trend: [
      { month: '2026-03', score: 3.6 },
      { month: '2026-04', score: 3.6 },
      { month: '2026-05', score: 3.65 },
      { month: '2026-06', score: 3.7 },
      { month: '2026-07', score: 3.7 },
      { month: '2026-08', score: 3.7 },
    ],
    subIssues: [
      { id: 's1', label: { th: 'ฟีดแบ็กไม่สม่ำเสมอ', en: 'Inconsistent feedback' }, percentage: 33 },
      { id: 's2', label: { th: 'การสื่อสารนโยบาย', en: 'Policy communication' }, percentage: 27 },
    ],
    sentiment: { positive: 52, neutral: 30, negative: 18 },
    sampleQuotes: [
      'หัวหน้าให้คำแนะนำดี แต่บางทีเรื่องนโยบายใหม่ ๆ กว่าจะรู้ก็ช้าไปหน่อย',
      'อยากได้ฟีดแบ็กที่สม่ำเสมอกว่านี้ ไม่ใช่แค่ตอนประเมินผลประจำปี',
    ],
  },
}
