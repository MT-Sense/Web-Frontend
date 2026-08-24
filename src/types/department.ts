/** Drives n<5 suppression: any view grouped by department must check respondentCount.
 * name is a plain string — the backend's departments table has a single VARCHAR column,
 * not a localized pair, so department/position names are not translated (only UI chrome
 * strings are, via i18n). */
export interface Department {
  id: string
  name: string
  respondentCount: number
}
