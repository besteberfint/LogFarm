import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import {
  I18nContext,
  LOCALES,
  formatTemplate,
  type I18nValue,
  type Vars,
} from './context'
import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
  translations,
  type Language,
  type TranslationKey,
} from './translations'

const STORAGE_KEY = 'logfarm.language'

function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && LANGUAGES.includes(value as Language)
}

// Electron varsa tercih electron-store'da, tarayıcı geliştirmesinde localStorage'da tutulur.
async function readStoredLanguage(): Promise<Language> {
  if (window.logfarm?.getLanguage) {
    const result = await window.logfarm.getLanguage()
    return result.ok && isLanguage(result.language) ? result.language : DEFAULT_LANGUAGE
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  return isLanguage(stored) ? stored : DEFAULT_LANGUAGE
}

function writeStoredLanguage(language: Language) {
  if (window.logfarm?.setLanguage) {
    void window.logfarm.setLanguage(language)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, language)
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(DEFAULT_LANGUAGE)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let active = true
    void readStoredLanguage().then((stored) => {
      if (active) {
        setLanguageState(stored)
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = language
  }, [language])

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    writeStoredLanguage(next)
  }, [])

  const value = useMemo<I18nValue>(() => {
    const dictionary = translations[language]

    function t(key: TranslationKey, vars?: Vars) {
      return formatTemplate(dictionary[key] ?? translations.en[key] ?? key, vars)
    }

    return {
      language,
      locale: LOCALES[language],
      setLanguage,
      t,
      // Ana süreç metin değil kod döndürür; bilinmeyen kod gelirse ham detaya düşeriz.
      tError(error) {
        const template = dictionary[error.code as TranslationKey]
        return template
          ? formatTemplate(template, error.params)
          : error.detail || t('errors.analyzeFailed')
      },
      formatNumber(input) {
        return new Intl.NumberFormat(LOCALES[language]).format(input)
      },
    }
  }, [language, setLanguage])

  // Kayıtlı tercih okunmadan çizersek kullanıcı bir an yanlış dili görür.
  if (!ready) {
    return null
  }

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
