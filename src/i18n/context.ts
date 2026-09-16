import { createContext, useContext } from 'react'
import type { AppError } from '../types'
import type { Language, TranslationKey } from './translations'

export const LOCALES: Record<Language, string> = {
  en: 'en-US',
  tr: 'tr-TR',
}

export type Vars = Record<string, string | number>

export type I18nValue = {
  language: Language
  locale: string
  setLanguage: (language: Language) => void
  t: (key: TranslationKey, vars?: Vars) => string
  tError: (error: AppError) => string
  formatNumber: (value: number) => string
}

export const I18nContext = createContext<I18nValue | null>(null)

export function formatTemplate(template: string, vars?: Vars) {
  if (!vars) {
    return template
  }
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function useI18n() {
  const value = useContext(I18nContext)
  if (!value) {
    throw new Error('useI18n must be used inside I18nProvider')
  }
  return value
}
