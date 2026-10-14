import { useState } from 'react'
import { useI18n } from '../i18n/context'
import type { AppError } from '../types'

const SUPPORT_MAIL_URL =
  'https://mail.google.com/mail/?view=cm&fs=1&to=logfarm.support%40gmail.com&su=LogFarm'

export function SupportSettings() {
  const { t, tError } = useI18n()
  const [error, setError] = useState<AppError | null>(null)

  async function handleWrite() {
    setError(null)
    if (window.logfarm?.openSupportMail) {
      const result = await window.logfarm.openSupportMail()
      if (!result.ok) {
        setError(result)
      }
      return
    }
    window.open(SUPPORT_MAIL_URL, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium text-slate-300">{t('support.label')}</h2>
        <p className="mt-1 text-xs text-slate-500">{t('support.help')}</p>
      </div>
      <div>
        <button
          type="button"
          onClick={() => {
            void handleWrite()
          }}
          className="rounded-lg border border-farm-700 bg-farm-800 px-3 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700"
        >
          {t('support.write')}
        </button>
      </div>
      {error ? <p className="text-xs text-red-300">{tError(error)}</p> : null}
    </div>
  )
}
