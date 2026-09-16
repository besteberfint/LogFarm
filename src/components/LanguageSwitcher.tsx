import { useI18n } from '../i18n/context'
import { LANGUAGES, LANGUAGE_LABELS, LANGUAGE_NAMES } from '../i18n/translations'

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n()

  return (
    <div
      role="group"
      aria-label={t('app.languageLabel')}
      className="flex shrink-0 overflow-hidden rounded-lg border border-farm-800"
    >
      {LANGUAGES.map((option) => {
        const selected = option === language
        return (
          <button
            key={option}
            type="button"
            title={LANGUAGE_NAMES[option]}
            aria-pressed={selected}
            onClick={() => setLanguage(option)}
            className={`px-3 py-1.5 text-xs font-medium ${
              selected
                ? 'bg-farm-500 text-farm-950'
                : 'bg-farm-900 text-slate-400 hover:bg-farm-800 hover:text-slate-200'
            }`}
          >
            {LANGUAGE_LABELS[option]}
          </button>
        )
      })}
    </div>
  )
}
