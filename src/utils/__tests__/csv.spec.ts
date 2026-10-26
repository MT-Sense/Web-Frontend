import { describe, expect, it } from 'vitest'
import { toCsv } from '../csv'

describe('toCsv', () => {
  it('writes titled sections separated by a blank line', () => {
    const csv = toCsv([
      { title: 'ภาพรวม', headers: ['metric', 'value'], rows: [['eNPS', 12], ['empty', null]] },
      { title: 'Second', headers: ['a'], rows: [] },
    ])
    expect(csv).toBe('ภาพรวม\r\nmetric,value\r\neNPS,12\r\nempty,\r\n\r\nSecond\r\na')
  })

  it('quotes commas, quotes and newlines', () => {
    expect(toCsv([{ title: 't', headers: ['h'], rows: [['a,b'], ['say "hi"'], ['two\nlines']] }])).toBe(
      't\r\nh\r\n"a,b"\r\n"say ""hi"""\r\n"two\nlines"',
    )
  })

  it('neutralises spreadsheet formulas in text but keeps negative numbers', () => {
    const csv = toCsv([{ title: 't', headers: ['h'], rows: [['=HYPERLINK("x")'], ['-cmd'], [-5]] }])
    expect(csv).toBe('t\r\nh\r\n"\'=HYPERLINK(""x"")"\r\n\'-cmd\r\n-5')
  })
})
