/** A titled table inside an exported CSV file. */
export interface CsvSection {
  title: string
  headers: string[]
  rows: (string | number | null | undefined)[][]
}

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  let text = String(value)
  // A leading = + - @ makes spreadsheets evaluate the cell as a formula (CSV injection);
  // comments come from employees, so neutralise it. Plain negative numbers stay numbers.
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`
  return /[",\r\n]/.test(text) ? `"${text.split('"').join('""')}"` : text
}

/** Several sections in one CSV, separated by a blank line, each with a title row. */
export function toCsv(sections: CsvSection[]): string {
  return sections
    .map((s) => [[s.title], s.headers, ...s.rows].map((row) => row.map(cell).join(',')).join('\r\n'))
    .join('\r\n\r\n')
}

/** Downloads text as a UTF-8 CSV with a BOM, so Excel shows Thai correctly. */
export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['﻿', content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}
