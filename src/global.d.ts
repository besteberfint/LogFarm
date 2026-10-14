import type {
  AnalyzeResult,
  ApiKeyMutationResult,
  ApiKeyStatusResult,
  HistoryClearResult,
  HistoryGetResult,
  HistoryListResult,
  HistoryLocalizeResult,
  LanguageResult,
  LicenseBuyResult,
  LicenseStatusResult,
  SupportMailResult,
} from './types'

export {}

declare global {
  interface Window {
    logfarm?: {
      analyze: (logText: string, language?: string) => Promise<AnalyzeResult>
      cancelAnalyze: () => Promise<{ ok: true }>
      getLanguage: () => Promise<LanguageResult>
      setLanguage: (language: string) => Promise<LanguageResult>
      getApiKeyStatus: () => Promise<ApiKeyStatusResult>
      saveApiKey: (key: string) => Promise<ApiKeyMutationResult>
      clearApiKey: () => Promise<ApiKeyMutationResult>
      listHistory: (language?: string) => Promise<HistoryListResult>
      getHistoryItem: (id: string, language?: string) => Promise<HistoryGetResult>
      localizeHistory: (
        language: string,
        itemId?: string | null,
      ) => Promise<HistoryLocalizeResult>
      clearHistory: () => Promise<HistoryClearResult>
      getLicenseStatus: (validate?: boolean) => Promise<LicenseStatusResult>
      activateLicense: (key: string) => Promise<LicenseStatusResult>
      clearLicense: () => Promise<LicenseStatusResult>
      openLicenseCheckout: () => Promise<LicenseBuyResult>
      openSupportMail: () => Promise<SupportMailResult>
      onUnexpectedError: (
        callback: (payload: { code: string; params?: Record<string, string | number> }) => void,
      ) => () => void
    }
  }
}
