import { useI18n } from '../i18n/context'
import type { AnalysisReport, AppError } from '../types'
import { CopyButton } from './CopyButton'

const LONG_LOG_LIMIT = 80_000

const ICON_PROPS = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'h-[18px] w-[18px] shrink-0 text-farm-400',
} as const

// Buğday demeti: özet, yani hasadın kendisi.
function SummaryIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 20.5V9" />
      <path d="M12 9C9 9 8 6.5 8 4.5c2.5 0 4 2 4 4.5Z" />
      <path d="M12 9c3 0 4-2.5 4-4.5-2.5 0-4 2-4 4.5Z" />
      <path d="M7.5 20.5h9" />
    </svg>
  )
}

// Kök: kök neden.
function RootCauseIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M12 3.5V11" />
      <path d="M12 11c0 4-3 5-4.5 9.5" />
      <path d="M12 11c0 4 3 5 4.5 9.5" />
      <path d="M12 13.5v7" />
    </svg>
  )
}

// Sürülmüş tarla sıraları: sırayla yürünecek adımlar.
function StepsIcon() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3.5 18.5c4.5-4.5 12.5-4.5 17 0" />
      <path d="M5.5 13c3.5-3.5 9.5-3.5 13 0" />
      <path d="M7.5 7.5c2.5-2.5 6.5-2.5 9 0" />
    </svg>
  )
}

type ReportPanelProps = {
  report: AnalysisReport | null
  error: AppError | null
  truncated: boolean
  isAnalyzing: boolean
  onRetry?: () => void
}

export function ReportPanel({
  report,
  error,
  truncated,
  isAnalyzing,
  onRetry,
}: ReportPanelProps) {
  const { t, tError, formatNumber } = useI18n()

  function formatFullReport(value: AnalysisReport) {
    const steps = value.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
    return [
      t('report.summary'),
      value.summary,
      '',
      t('report.rootCause'),
      value.rootCause,
      '',
      t('report.steps'),
      steps,
    ].join('\n')
  }

  return (
    <section
      aria-busy={isAnalyzing}
      aria-live="polite"
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-300">{t('report.title')}</h2>
        {report && !isAnalyzing && !error ? (
          <CopyButton text={formatFullReport(report)} labelKey="report.copyAll" />
        ) : null}
      </div>
      {isAnalyzing ? (
        <div className="rounded-xl border border-farm-800 bg-farm-900 px-4 py-8 text-center">
          <p className="text-sm text-slate-300">{t('report.loading')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('report.loadingHint')}</p>
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-900/60 bg-red-950/40 px-4 py-8 text-center">
          <p className="text-sm text-red-200">{tError(error)}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg bg-farm-500 px-4 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400"
            >
              {t('report.retry')}
            </button>
          ) : null}
        </div>
      ) : report ? (
        <>
          <p className="text-xs text-slate-500">{t('report.source')}</p>
          {truncated ? (
            <p className="rounded-xl border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
              {t('report.truncated', { limit: formatNumber(LONG_LOG_LIMIT) })}
            </p>
          ) : null}
          <article className="rounded-xl border border-farm-800 bg-farm-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-farm-400">
                <SummaryIcon />
                {t('report.summary')}
              </h3>
              <CopyButton text={report.summary} />
            </div>
            <p className="mt-2 text-sm text-slate-200">{report.summary}</p>
          </article>
          <article className="rounded-xl border border-farm-800 bg-farm-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-farm-400">
                <RootCauseIcon />
                {t('report.rootCause')}
              </h3>
              <CopyButton text={report.rootCause} />
            </div>
            <p className="mt-2 text-sm text-slate-200">{report.rootCause}</p>
          </article>
          <article className="rounded-xl border border-farm-800 bg-farm-900 p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-farm-400">
                <StepsIcon />
                {t('report.steps')}
              </h3>
              <CopyButton
                text={report.steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
              />
            </div>
            <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-200">
              {report.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </article>
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-farm-800 px-4 py-8 text-center text-sm text-slate-500">
          {t('report.empty')}
        </p>
      )}
    </section>
  )
}
