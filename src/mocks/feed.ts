import type { FeedPost } from '@/types/feedPost'

/** Covers all opt-in/publish combinations — only optedIn && published renders in the feed. */
export const feedPosts: FeedPost[] = [
  {
    id: 'f1',
    text: 'อยากให้มีการกระจายงานกะดึกให้เท่ากันมากขึ้น ตอนนี้บางคนหนักกว่าคนอื่นมาก',
    hashtags: ['ภาระงาน', 'กะดึก'],
    createdAt: '2026-08-05',
    upvotes: 142,
    downvotes: 4,
    hrReplied: true,
    optedIn: true,
    published: true,
  },
  {
    id: 'f2',
    text: 'สวัสดิการด้านสุขภาพจิตดีขึ้นมากในปีนี้ ขอบคุณที่รับฟัง',
    hashtags: ['สวัสดิการ'],
    createdAt: '2026-08-04',
    upvotes: 98,
    downvotes: 1,
    hrReplied: false,
    optedIn: true,
    published: true,
  },
  {
    id: 'f3',
    text: 'อยากเห็นเส้นทางเติบโตที่ชัดเจนกว่านี้ ตอนนี้ไม่รู้ว่าต้องทำอะไรถึงจะโตในสายงาน',
    hashtags: ['เติบโต'],
    createdAt: '2026-08-03',
    upvotes: 76,
    downvotes: 2,
    hrReplied: true,
    optedIn: true,
    published: true,
  },
  {
    id: 'f4',
    text: 'ทีมดีมากค่ะ บรรยากาศการทำงานสนุก ช่วยเหลือกันดี',
    hashtags: ['ทีม'],
    createdAt: '2026-08-02',
    upvotes: 54,
    downvotes: 0,
    hrReplied: false,
    optedIn: true,
    published: true,
  },
  {
    id: 'f5',
    text: 'ข้อความนี้เพิ่งส่งเข้าระบบ อยู่ระหว่างตรวจสอบก่อนเผยแพร่',
    hashtags: ['ภาระงาน'],
    createdAt: '2026-08-09',
    upvotes: 0,
    downvotes: 0,
    hrReplied: false,
    optedIn: true,
    published: false,
  },
  {
    id: 'f6',
    text: 'ความเห็นนี้ผู้ตอบไม่ได้เลือกเผยแพร่ จึงไม่ปรากฏใน feed',
    hashtags: ['ค่าตอบแทน'],
    createdAt: '2026-08-08',
    upvotes: 0,
    downvotes: 0,
    hrReplied: false,
    optedIn: false,
    published: false,
  },
]

export const publishedSummaries = [
  {
    id: 'sum-2026-07',
    title: { th: 'สรุปเดือนกรกฎาคม 2569', en: 'July 2026 Summary' },
    body: {
      th: 'eNPS ปรับตัวดีขึ้นจากเดือนก่อน ประเด็นหลักที่พนักงานพูดถึงคือภาระงานและเส้นทางเติบโต',
      en: 'eNPS improved from last month. Main themes raised were workload and growth path.',
    },
    publishedAt: '2026-08-01',
  },
]
