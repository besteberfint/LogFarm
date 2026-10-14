import { MOCK_REPORTS } from '../mockReport'
import type { AnalyzeResult } from '../types'

const BROWSER_MOCK_DELAY_MS = 900

let browserTimer: number | null = null
let browserSettle: ((result: AnalyzeResult) => void) | null = null

function mockLanguage(language?: string): 'en' | 'tr' {
  return language === 'tr' ? 'tr' : 'en'
}

export async function analyzeLog(
  logText: string,
  language?: string,
): Promise<AnalyzeResult> {
  if (window.logfarm?.analyze) {
    return window.logfarm.analyze(logText, language)
  }

  cancelBrowserMock()
  const reportLanguage = mockLanguage(language)

  return new Promise((resolve) => {
    browserSettle = resolve
    browserTimer = window.setTimeout(() => {
      browserTimer = null
      browserSettle = null
      resolve({
        ok: true,
        report: MOCK_REPORTS[reportLanguage],
        truncated: false,
        language: reportLanguage,
      })
    }, BROWSER_MOCK_DELAY_MS)
  })
}

export function cancelAnalyze() {
  if (window.logfarm?.cancelAnalyze) {
    void window.logfarm.cancelAnalyze()
    return
  }

  cancelBrowserMock()
}

function cancelBrowserMock() {
  if (browserTimer !== null) {
    window.clearTimeout(browserTimer)
    browserTimer = null
  }
  if (browserSettle) {
    const settle = browserSettle
    browserSettle = null
    settle({ ok: false, cancelled: true })
  }
}
