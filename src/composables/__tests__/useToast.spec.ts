import { afterEach, describe, expect, it, vi } from 'vitest'
import { dismissToast, toast, toasts } from '../useToast'

describe('useToast', () => {
  afterEach(() => {
    for (const item of [...toasts.value]) {
      dismissToast(item.id)
    }

    vi.useRealTimers()
  })

  it('shows reusable toast content and dismisses it manually', () => {
    const id = toast.success('บันทึกแล้ว', 'พร้อมให้ตรวจ')
    expect(toasts.value).toContainEqual(expect.objectContaining({ id, type: 'success', title: 'บันทึกแล้ว', description: 'พร้อมให้ตรวจ' }))

    dismissToast(id)
    expect(toasts.value).toHaveLength(0)
  })

  it('dismisses a toast after its duration', () => {
    vi.useFakeTimers()
    toast.info('กำลังอัปเดต', '', 1000)
    expect(toasts.value).toHaveLength(1)

    vi.advanceTimersByTime(1000)
    expect(toasts.value).toHaveLength(0)
  })
})
