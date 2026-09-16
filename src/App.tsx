import { useCallback, useEffect, useState } from 'react'
import { ApiKeySettings } from './components/ApiKeySettings'
import { HistoryList } from './components/HistoryList'
import { LanguageSwitcher } from './components/LanguageSwitcher'
import { LicenseSettings } from './components/LicenseSettings'
import { LogInput } from './components/LogInput'
import { ReportPanel } from './components/ReportPanel'
import { useI18n } from './i18n/context'
import { analyzeLog, cancelAnalyze } from './lib/analyze'
import type { AnalysisReport, AppError, HistoryListItem, LicenseStatus } from './types'

function App() {
  const { t } = useI18n()
  const [logText, setLogText] = useState('')
  const [report, setReport] = useState<AnalysisReport | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [truncated, setTruncated] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [historyItems, setHistoryItems] = useState<HistoryListItem[]>([])
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null)
  const [license, setLicense] = useState<LicenseStatus | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  // null = henüz okunmadı; tarayıcı geliştirmesinde null kalır ve şerit çıkmaz.
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)

  const trimmed = logText.trim()
  const licenseLocked = Boolean(license?.locked)
  const canAnalyze = trimmed.length > 0 && !isAnalyzing && !licenseLocked
  const canUseHistory = Boolean(window.logfarm?.listHistory)
  const bannerText = licenseLocked
    ? t('app.bannerLocked')
    : apiKeyConfigured === false
      ? t('app.bannerKeyMissing')
      : null

  const handleApiKeyConfigured = useCallback((configured: boolean) => {
    setApiKeyConfigured(configured)
  }, [])

  async function refreshLicense(validate = false) {
    if (!window.logfarm?.getLicenseStatus) {
      return
    }
    const result = await window.logfarm.getLicenseStatus(validate)
    if (result.ok) {
      setLicense(result)
    }
  }

  async function refreshHistory() {
    if (!window.logfarm?.listHistory) {
      return
    }
    const result = await window.logfarm.listHistory()
    if (result.ok) {
      setHistoryItems(result.items)
    }
  }

  useEffect(() => {
    void refreshHistory()
    void refreshLicense(false).then(() => refreshLicense(true))

    if (window.logfarm?.getApiKeyStatus) {
      void window.logfarm.getApiKeyStatus().then((result) => {
        if (result.ok) {
          setApiKeyConfigured(result.configured)
        }
      })
    }
  }, [])

  useEffect(() => {
    function preventWindowFileOpen(event: DragEvent) {
      event.preventDefault()
    }

    window.addEventListener('dragover', preventWindowFileOpen)
    window.addEventListener('drop', preventWindowFileOpen)
    return () => {
      window.removeEventListener('dragover', preventWindowFileOpen)
      window.removeEventListener('drop', preventWindowFileOpen)
    }
  }, [])

  async function handleAnalyze() {
    if (!canAnalyze) return

    setIsAnalyzing(true)
    setError(null)
    setTruncated(false)
    setActiveHistoryId(null)

    try {
      const result = await analyzeLog(trimmed)
      if (result.ok) {
        setReport(result.report)
        setTruncated(result.truncated)
        await refreshHistory()
        await refreshLicense()
      } else if ('cancelled' in result) {
        setError(null)
      } else {
        setReport(null)
        setTruncated(false)
        setError(result)
      }
    } catch {
      setReport(null)
      setTruncated(false)
      setError({ code: 'errors.analyzeFailed' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  function handleCancel() {
    cancelAnalyze()
  }

  async function handleSelectHistory(id: string) {
    if (!window.logfarm?.getHistoryItem) {
      return
    }
    const result = await window.logfarm.getHistoryItem(id)
    if (!result.ok) {
      setError(result)
      return
    }
    setLogText(result.item.logText)
    setReport(result.item.report)
    setTruncated(result.item.truncated)
    setError(null)
    setActiveHistoryId(id)
  }

  async function handleClearHistory() {
    if (!window.logfarm?.clearHistory) {
      return
    }
    const result = await window.logfarm.clearHistory()
    if (!result.ok) {
      setError(result)
      return
    }
    setHistoryItems([])
    setActiveHistoryId(null)
  }

  return (
    <div className="min-h-screen bg-farm-950 text-slate-100">
      <header className="border-b border-farm-800">
        <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 items-start gap-4">
            <img
              src={`${import.meta.env.BASE_URL}logo-mark.png`}
              alt="LogFarm"
              className="h-24 w-auto shrink-0 object-contain"
            />
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-farm-300">{t('app.title')}</h1>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-farm-400">
                {t('app.slogan')}
              </p>
              <p className="mt-1 text-sm text-slate-400">{t('app.subtitle')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => setShowSettings((open) => !open)}
              aria-pressed={showSettings}
              className="flex items-center gap-2 rounded-lg border border-farm-700 bg-farm-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700"
            >
              {showSettings ? (
                <span aria-hidden="true">←</span>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="h-4 w-4"
                >
                  <circle cx="12" cy="12" r="3.2" />
                  <path d="M12 3v2.2M12 18.8V21M4.6 7.8l1.9 1.1M17.5 15.1l1.9 1.1M4.6 16.2l1.9-1.1M17.5 8.9l1.9-1.1" />
                </svg>
              )}
              {showSettings ? t('app.backToAnalysis') : t('app.settings')}
            </button>
          </div>
        </div>
      </header>

      {showSettings ? (
        <main className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-8">
          <h2 className="text-lg font-semibold text-slate-100">{t('app.settingsTitle')}</h2>
          <ApiKeySettings onConfiguredChange={handleApiKeyConfigured} />
          <div className="border-t border-farm-800" />
          <LicenseSettings status={license} onStatusChange={setLicense} />
        </main>
      ) : (
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-8">
        {bannerText ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3">
            <p className="text-sm text-amber-200">{bannerText}</p>
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              className="rounded-lg bg-farm-500 px-3 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400"
            >
              {t('app.bannerAction')}
            </button>
          </div>
        ) : null}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <LogInput
            value={logText}
            disabled={isAnalyzing}
            canAnalyze={canAnalyze}
            isAnalyzing={isAnalyzing}
            lockHint={licenseLocked ? t('log.licenseLocked') : undefined}
            onChange={setLogText}
            onAnalyze={() => {
              void handleAnalyze()
            }}
            onCancel={handleCancel}
            onFileError={(fileError) => {
              setError(fileError)
              if (!fileError) {
                setReport(null)
                setTruncated(false)
                setActiveHistoryId(null)
              }
            }}
          />
          <ReportPanel
            report={report}
            error={error}
            truncated={truncated}
            isAnalyzing={isAnalyzing}
            onRetry={
              error && canAnalyze
                ? () => {
                    void handleAnalyze()
                  }
                : undefined
            }
          />
        </div>
        {canUseHistory ? (
          <HistoryList
            items={historyItems}
            activeId={activeHistoryId}
            onSelect={(id) => {
              void handleSelectHistory(id)
            }}
            onClear={() => {
              void handleClearHistory()
            }}
          />
        ) : (
          <p className="text-sm text-slate-500">{t('app.historyElectronOnly')}</p>
        )}
      </main>
      )}
    </div>
  )
}

export default App
