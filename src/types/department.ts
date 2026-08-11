/** Drives n<5 suppression: any view grouped by department must check respondentCount. */
export interface Department {
  id: string
  name: LocalizedName
  respondentCount: number
}

export interface LocalizedName {
  th: string
  en: string
}

export type TenureBucket = '<1y' | '1-3y' | '3-5y' | '5y+'
