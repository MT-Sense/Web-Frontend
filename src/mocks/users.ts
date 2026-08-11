import type { CurrentUser, Role } from '@/types/user'

export const usersByRole: Record<Role, CurrentUser> = {
  HR: {
    id: 'u-hr',
    fullName: 'พิมพ์ชนก ศรีสุข',
    role: 'HR',
    department: 'ฝ่ายทรัพยากรบุคคล',
    lastLoginAt: '2026-08-09T08:12:00+07:00',
    notifyNewRound: true,
    notifyMonthlySummary: true,
  },
  Executive: {
    id: 'u-exec',
    fullName: 'ธนกร วิริยะกุล',
    role: 'Executive',
    department: 'สำนักผู้บริหาร',
    lastLoginAt: '2026-08-09T07:45:00+07:00',
    notifyNewRound: false,
    notifyMonthlySummary: true,
  },
  Employee: {
    id: 'u-emp',
    fullName: 'อรวรรณ ใจดี',
    role: 'Employee',
    department: 'ฝ่ายวิศวกรรม',
    lastLoginAt: '2026-08-09T09:03:00+07:00',
    notifyNewRound: true,
    notifyMonthlySummary: false,
  },
}
