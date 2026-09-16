import type {
  AnalyzeResult,
  ApiKeyMutationResult,
  ApiKeyStatusResult,
  HistoryClearResult,
  HistoryGetResult,
  HistoryListResult,
  LanguageResult,
  LicenseBuyResult,
  LicenseStatusResult,
} from './types'

export {}

declare global {
  interface Window {
    logfarm?: {
      analyze: (logText: string) => Promise<AnalyzeResult>
      cancelAnalyze: () => Promise<{ ok: true }>
      getLanguage: () => Promise<LanguageResult>
      setLanguage: (language: string) => Promise<LanguageResult>
      getApiKeyStatus: () => Promise<ApiKeyStatusResult>
      saveApiKey: (key: string) => Promise<ApiKeyMutationResult>
      clearApiKey: () => Promise<ApiKeyMutationResult>
      listHistory: () => Promise<HistoryListResult>
      getHistoryItem: (id: string) => Promise<HistoryGetResult>
      clearHistory: () => Promise<HistoryClearResult>
      getLicenseStatus: (validate?: boolean) => Promise<LicenseStatusResult>
      activateLicense: (key: string) => Promise<LicenseStatusResult>
      clearLicense: () => Promise<LicenseStatusResult>
      openLicenseCheckout: () => Promise<LicenseBuyResult>
    }
  }
}
