import type { ActionItem } from '@/types/actionItem'

export const actionItems: ActionItem[] = [
  {
    id: 'a1',
    topic: { th: 'จัดตารางกะดึกใหม่', en: 'Rebalance night shift schedule' },
    assignee: 'หัวหน้าฝ่ายซัพพอร์ต',
    status: 'in_progress',
    createdBy: 'HR',
    level: 'full',
    targetDate: '2026-09-01',
  },
  {
    id: 'a2',
    topic: { th: 'เปิดเผยเกณฑ์เลื่อนตำแหน่ง', en: 'Publish promotion criteria' },
    assignee: 'ฝ่ายทรัพยากรบุคคล',
    status: 'done',
    createdBy: 'HR',
    level: 'full',
    targetDate: '2026-08-01',
  },
  {
    id: 'a3',
    topic: { th: 'ทบทวนนโยบาย OT ทั้งองค์กร', en: 'Review company-wide OT policy' },
    assignee: 'คณะผู้บริหาร',
    status: 'in_progress',
    createdBy: 'Executive',
    level: 'decision',
    targetDate: '2026-10-01',
  },
]
