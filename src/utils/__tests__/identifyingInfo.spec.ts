import { describe, it, expect } from 'vitest'
import { looksIdentifying } from '../identifyingInfo'

describe('looksIdentifying', () => {
  it('flags questions asking for name or employee ID', () => {
    expect(looksIdentifying('กรุณากรอกชื่อ-นามสกุลของคุณ')).toBe(true)
    expect(looksIdentifying('รหัสพนักงานของคุณคืออะไร')).toBe(true)
    expect(looksIdentifying('What is your email address?')).toBe(true)
  })

  it('does not flag ordinary survey questions', () => {
    expect(looksIdentifying('คุณพอใจกับบรรยากาศการทำงานโดยรวมแค่ไหน?')).toBe(false)
  })
})
