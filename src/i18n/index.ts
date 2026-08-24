import { createI18n } from 'vue-i18n'
import th from './locales/th'
import en from './locales/en'
import type { Locale } from '@/types/common'

const STORAGE_KEY = 'mt-sense-locale'

function initialLocale(): Locale {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored === 'en' ? 'en' : 'th'
}

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale(),
  fallbackLocale: 'th',
  messages: { th, en },
})

export function setLocale(locale: Locale) {
  i18n.global.locale.value = locale
  localStorage.setItem(STORAGE_KEY, locale)
}
