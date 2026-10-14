import { useI18n } from '../i18n/context'

export function PrivacySettings() {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm font-medium text-slate-300">{t('privacy.label')}</h2>
      <p className="text-xs leading-5 text-slate-500">{t('privacy.log')}</p>
      <p className="text-xs leading-5 text-slate-500">{t('privacy.history')}</p>
      <p className="text-xs leading-5 text-slate-500">{t('privacy.license')}</p>
      <p className="text-xs leading-5 text-slate-500">{t('privacy.payment')}</p>
    </div>
  )
}
