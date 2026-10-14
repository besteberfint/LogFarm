export type AnalysisReport = {
  summary: string
  rootCause: string
  steps: string[]
}

// Ana süreç hazır metin değil çeviri kodu döndürür; detail yalnızca beklenmeyen
// hatalarda dolu gelir ve çeviri bulunamazsa yedek olarak gösterilir.
export type AppError = {
  code: string
  params?: Record<string, string | number>
  detail?: string
}

export type ErrorResult = { ok: false } & AppError

export type AnalyzeResult =
  | {
      ok: true
      report: AnalysisReport
      truncated: boolean
      language?: string
      historyId?: string | null
    }
  | { ok: false; cancelled: true }
  | ErrorResult

export type LanguageResult = { ok: true; language: string } | ErrorResult

export type ApiKeyStatusResult = { ok: true; configured: boolean } | ErrorResult

export type ApiKeyMutationResult = { ok: true; configured: boolean } | ErrorResult

export type HistoryListItem = {
  id: string
  createdAt: string
  summary: string
}

export type HistoryRecord = {
  id: string
  createdAt: string
  logText: string
  report: AnalysisReport
  truncated: boolean
  language?: string
  hasLanguage?: boolean
}

export type HistoryListResult =
  | { ok: true; items: HistoryListItem[]; missingCount?: number }
  | ErrorResult

export type HistoryGetResult = { ok: true; item: HistoryRecord } | ErrorResult

export type HistoryLocalizeResult =
  | {
      ok: true
      items: HistoryListItem[]
      item: HistoryRecord | null
      localizeError?: AppError
    }
  | { ok: false; cancelled: true }
  | ErrorResult

export type HistoryClearResult = { ok: true } | ErrorResult

export type LicenseStatus = {
  unlocked: boolean
  licensed: boolean
  locked: boolean
}

export type LicenseStatusResult = ({ ok: true } & LicenseStatus) | ErrorResult

export type LicenseBuyResult = { ok: true } | ErrorResult

export type SupportMailResult = { ok: true } | ErrorResult

