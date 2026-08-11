const IDENTIFYING_KEYWORDS = [
  'ชื่อ',
  'นามสกุล',
  'รหัสพนักงาน',
  'เบอร์โทร',
  'อีเมล',
  'email',
  'employee id',
  'name',
]

export function looksIdentifying(text: string): boolean {
  const lower = text.toLowerCase()
  return IDENTIFYING_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()))
}
