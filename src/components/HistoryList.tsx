import { useI18n } from '../i18n/context'
import type { HistoryListItem } from '../types'

type HistoryListProps = {
  items: HistoryListItem[]
  activeId: string | null
  onSelect: (id: string) => void
  onClear: () => void
}

export function HistoryList({ items, activeId, onSelect, onClear }: HistoryListProps) {
  const { t, locale } = useI18n()

  function formatTime(iso: string) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
      return iso
    }
    return date.toLocaleString(locale, {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-slate-300">{t('history.title')}</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={items.length === 0}
          className="text-xs text-slate-500 hover:text-slate-300 disabled:opacity-40"
        >
          {t('history.clearAll')}
        </button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-farm-800 px-4 py-6 text-sm text-slate-500">
          {t('history.empty')}
        </p>
      ) : (
        <ul className="flex max-h-64 flex-col gap-2 overflow-y-auto">
          {items.map((item) => {
            const selected = item.id === activeId
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onSelect(item.id)}
                  className={`w-full rounded-xl border px-4 py-3 text-left ${
                    selected
                      ? 'border-farm-500 bg-farm-900'
                      : 'border-farm-800 bg-farm-900/60 hover:border-farm-600'
                  }`}
                >
                  <p className="text-xs text-slate-500">{formatTime(item.createdAt)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-200">
                    {item.summary || t('history.untitled')}
                  </p>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
