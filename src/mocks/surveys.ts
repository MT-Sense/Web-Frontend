import type { Survey } from '@/types/survey'

export const surveys: Record<string, Survey> = {
  'demo-1': {
    id: 'demo-1',
    title: { th: 'แบบสำรวจประสบการณ์การทำงาน สิงหาคม 2569', en: 'Employee Experience Survey — August 2026' },
    cadence: 'monthly',
    nextRoundDate: '2026-09-01',
    steps: [
      {
        id: 'step-1',
        title: { th: 'บรรยากาศในที่ทำงาน', en: 'Workplace atmosphere' },
        estimatedMinutes: 4,
        questions: [
          {
            id: 'q1',
            type: 'scale5',
            text: { th: 'คุณพอใจกับบรรยากาศการทำงานโดยรวมแค่ไหน?', en: 'How satisfied are you with the overall work atmosphere?' },
            required: true,
            metricMapping: 'satisfaction',
          },
          {
            id: 'q2',
            type: 'enps',
            text: { th: 'คุณจะแนะนำให้เพื่อนมาทำงานที่นี่มากแค่ไหน (0-10)?', en: 'How likely are you to recommend working here (0-10)?' },
            required: true,
            metricMapping: 'eNPS',
          },
        ],
      },
      {
        id: 'step-2',
        title: { th: 'ทีมและหัวหน้างาน', en: 'Team & management' },
        estimatedMinutes: 3,
        questions: [
          {
            id: 'q3',
            type: 'singleChoice',
            text: { th: 'คุณได้รับฟีดแบ็กจากหัวหน้าบ่อยแค่ไหน?', en: 'How often do you receive feedback from your manager?' },
            required: true,
            options: [
              { th: 'ทุกสัปดาห์', en: 'Weekly' },
              { th: 'ทุกเดือน', en: 'Monthly' },
              { th: 'ไม่บ่อยนัก', en: 'Rarely' },
            ],
          },
          {
            id: 'q4',
            type: 'multiChoice',
            text: { th: 'อะไรคือปัจจัยที่ทำให้ทีมทำงานได้ดี? (เลือกได้หลายข้อ)', en: 'What makes your team work well? (select all that apply)' },
            required: false,
            options: [
              { th: 'การสื่อสารที่ดี', en: 'Good communication' },
              { th: 'เป้าหมายชัดเจน', en: 'Clear goals' },
              { th: 'ความช่วยเหลือซึ่งกันและกัน', en: 'Mutual support' },
            ],
          },
        ],
      },
      {
        id: 'step-3',
        title: { th: 'ความคิดเห็นเพิ่มเติม', en: 'Additional feedback' },
        estimatedMinutes: 3,
        questions: [
          {
            id: 'q5',
            type: 'openText',
            text: { th: 'มีอะไรอยากบอกเพิ่มเติมไหม?', en: 'Anything else you would like to share?' },
            required: false,
            sendToAi: true,
            tagSuggestions: ['ภาระงาน', 'สวัสดิการ', 'สื่อสาร'],
            allowPublishOptIn: true,
          },
        ],
      },
    ],
  },
}
