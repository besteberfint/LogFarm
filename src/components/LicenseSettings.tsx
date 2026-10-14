import { useState } from 'react'
import { useI18n } from '../i18n/context'
import type { TranslationKey } from '../i18n/translations'
import type { AppError, LicenseStatus } from '../types'

const EMPTY_STATUS: LicenseStatus = {
  unlocked: false,
  licensed: false,
  locked: true,
}

type LicenseSettingsProps = {
  status: LicenseStatus | null
  onStatusChange: (status: LicenseStatus) => void
}

export function LicenseSettings({ status, onStatusChange }: LicenseSettingsProps) {
  const { t, tError } = useI18n()
  const canUseNativeStore = Boolean(window.logfarm?.getLicenseStatus)
  const [keyInput, setKeyInput] = useState('')
  const [messageKey, setMessageKey] = useState<TranslationKey | null>(null)
  const [error, setError] = useState<AppError | null>(null)
  const [busy, setBusy] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  const current = status ?? EMPTY_STATUS
  const showBuy = !current.unlocked && !current.licensed
  const showKeyInput = !current.unlocked && !current.licensed

  function helpText() {
    if (current.unlocked) {
      return t('license.helpDev')
    }
    if (current.licensed) {
      return t('license.helpLicensed')
    }
    return t('license.helpLocked')
  }

  function statusText() {
    if (current.unlocked) {
      return t('license.statusDev')
    }
    if (current.licensed) {
      return t('license.statusLicensed')
    }
    return t('license.statusLocked')
  }

  if (!canUseNativeStore) {
    return <p className="text-sm text-slate-400">{t('license.electronOnly')}</p>
  }

  async function handleActivate() {
    if (!window.logfarm?.activateLicense) return
    setBusy(true)
    setError(null)
    setMessageKey(null)
    setConfirmRemove(false)

    const result = await window.logfarm.activateLicense(keyInput)
    setBusy(false)

    if (!result.ok) {
      setError(result)
      return
    }

    setKeyInput('')
    setMessageKey('license.activatedMessage')
    onStatusChange(result)
  }

  async function handleClear() {
    if (!window.logfarm?.clearLicense) return
    setBusy(true)
    setError(null)
    setMessageKey(null)

    const result = await window.logfarm.clearLicense()
    setBusy(false)
    setConfirmRemove(false)

    if (!result.ok) {
      setError(result)
      return
    }

    setMessageKey('license.clearedMessage')
    onStatusChange(result)
  }

  async function handleBuy() {
    if (!window.logfarm?.openLicenseCheckout) return
    setBusy(true)
    setError(null)
    setMessageKey(null)

    const result = await window.logfarm.openLicenseCheckout()
    setBusy(false)

    if (!result.ok) {
      setError(result)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label
          htmlFor={showKeyInput ? 'license-input' : undefined}
          className="text-sm font-medium text-slate-300"
        >
          {t('license.label')}
        </label>
        <p className="mt-1 text-xs text-slate-500">{helpText()}</p>
      </div>
      {showKeyInput ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            id="license-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={keyInput}
            onChange={(event) => setKeyInput(event.target.value)}
            placeholder={t('license.placeholder')}
            className="w-full rounded-lg border border-farm-800 bg-farm-900 px-3 py-2 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-farm-500 focus:ring-1 focus:ring-farm-500"
          />
          <button
            type="button"
            onClick={() => {
              void handleActivate()
            }}
            disabled={busy || keyInput.trim().length === 0}
            className="shrink-0 rounded-lg bg-farm-500 px-3 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400 disabled:cursor-not-allowed disabled:bg-farm-800 disabled:text-slate-400"
          >
            {t('license.activate')}
          </button>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {showBuy ? (
          <button
            type="button"
            onClick={() => {
              void handleBuy()
            }}
            disabled={busy}
            className="rounded-lg bg-farm-500 px-3 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400 disabled:cursor-not-allowed disabled:bg-farm-800 disabled:text-slate-400"
          >
            {t('license.buy')}
          </button>
        ) : null}
        {current.licensed ? (
          confirmRemove ? (
            <>
              <p className="text-xs text-amber-300">{t('license.removeConfirm')}</p>
              <button
                type="button"
                onClick={() => {
                  void handleClear()
                }}
                disabled={busy}
                className="rounded-lg border border-red-700/70 bg-red-950/40 px-3 py-2 text-sm font-medium text-red-200 hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('license.removeConfirmYes')}
              </button>
              <button
                type="button"
                onClick={() => setConfirmRemove(false)}
                disabled={busy}
                className="rounded-lg border border-farm-700 bg-farm-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {t('license.removeConfirmNo')}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setError(null)
                setMessageKey(null)
                setConfirmRemove(true)
              }}
              disabled={busy}
              className="rounded-lg border border-farm-700 bg-farm-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t('license.remove')}
            </button>
          )
        ) : null}
      </div>
      {showBuy ? <p className="text-xs text-slate-500">{t('license.buyHint')}</p> : null}
      <p
        className={`text-xs ${
          current.locked ? 'text-amber-300' : current.licensed ? 'text-farm-300' : 'text-slate-500'
        }`}
      >
        {statusText()}
      </p>
      {messageKey ? <p className="text-xs text-farm-300">{t(messageKey)}</p> : null}
      {error ? <p className="text-xs text-red-300">{tError(error)}</p> : null}
    </div>
  )
}
