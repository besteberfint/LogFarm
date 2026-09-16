import { useEffect, useState } from 'react'
import { useI18n } from '../i18n/context'
import type { TranslationKey } from '../i18n/translations'
import type { AppError } from '../types'

type ApiKeySettingsProps = {
  onConfiguredChange?: (configured: boolean) => void
}

export function ApiKeySettings({ onConfiguredChange }: ApiKeySettingsProps) {
  const { t, tError } = useI18n()
  const canUseNativeStore = Boolean(window.logfarm?.saveApiKey)
  const [keyInput, setKeyInput] = useState('')
  const [configured, setConfigured] = useState(false)
  // Metni değil anahtarı tutuyoruz; dil değişince mesaj da çevrilsin.
  const [messageKey, setMessageKey] = useState<TranslationKey | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!window.logfarm?.getApiKeyStatus) {
      return
    }

    void window.logfarm.getApiKeyStatus().then((result) => {
      if (result.ok) {
        setConfigured(result.configured)
        onConfiguredChange?.(result.configured)
      }
    })
  }, [onConfiguredChange])

  if (!canUseNativeStore) {
    return <p className="text-sm text-slate-400">{t('apiKey.electronOnly')}</p>
  }

  async function handleSave() {
    if (!window.logfarm?.saveApiKey) return
    setBusy(true)
    setError(null)
    setMessageKey(null)

    const result = await window.logfarm.saveApiKey(keyInput)
    setBusy(false)

    if (!result.ok) {
      setError(result)
      return
    }

    setConfigured(true)
    setKeyInput('')
    setMessageKey('apiKey.savedMessage')
    onConfiguredChange?.(true)
  }

  async function handleClear() {
    if (!window.logfarm?.clearApiKey) return
    setBusy(true)
    setError(null)
    setMessageKey(null)

    const result = await window.logfarm.clearApiKey()
    setBusy(false)

    if (!result.ok) {
      setError(result)
      return
    }

    setConfigured(false)
    setMessageKey('apiKey.clearedMessage')
    onConfiguredChange?.(false)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="api-key-input" className="text-sm font-medium text-slate-300">
          {t('apiKey.label')}
        </label>
        <p className="mt-1 text-xs text-slate-500">{t('apiKey.help')}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          id="api-key-input"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={keyInput}
          onChange={(event) => setKeyInput(event.target.value)}
          placeholder={
            configured ? t('apiKey.placeholderConfigured') : t('apiKey.placeholderEmpty')
          }
          className="w-full rounded-lg border border-farm-800 bg-farm-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-farm-500 focus:ring-1 focus:ring-farm-500"
        />
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              void handleSave()
            }}
            disabled={busy || keyInput.trim().length === 0}
            className="rounded-lg bg-farm-500 px-3 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400 disabled:cursor-not-allowed disabled:bg-farm-800 disabled:text-slate-400"
          >
            {t('apiKey.save')}
          </button>
          <button
            type="button"
            onClick={() => {
              void handleClear()
            }}
            disabled={busy || !configured}
            className="rounded-lg border border-farm-700 bg-farm-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('apiKey.clear')}
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500">
        {configured ? t('apiKey.statusConfigured') : t('apiKey.statusMissing')}
      </p>
      {messageKey ? <p className="text-xs text-farm-300">{t(messageKey)}</p> : null}
      {error ? <p className="text-xs text-red-300">{tError(error)}</p> : null}
    </div>
  )
}
