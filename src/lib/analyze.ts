import { MOCK_REPORT } from '../mockReport'
import type { AnalyzeResult } from '../types'

const BROWSER_MOCK_DELAY_MS = 900

let browserTimer: number | null = null
let browserSettle: ((result: AnalyzeResult) => void) | null = null

export async function analyzeLog(logText: string): Promise<AnalyzeResult> {
  if (window.logfarm?.analyze) {
    return window.logfarm.analyze(logText)
  }

  cancelBrowserMock()

  return new Promise((resolve) => {
    browserSettle = resolve
    browserTimer = window.setTimeout(() => {
      browserTimer = null
      browserSettle = null
      resolve({ ok: true, report: MOCK_REPORT, truncated: false })
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
