const { randomUUID } = require('crypto')

const MAX_ITEMS = 20
const MAX_LOG_CHARS = 80_000

let store = null

function isReport(value) {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof value.summary === 'string' &&
      typeof value.rootCause === 'string' &&
      Array.isArray(value.steps),
  )
}

function reportsOf(item) {
  const reports = {}
  if (item && item.reports && typeof item.reports === 'object') {
    if (isReport(item.reports.en)) {
      reports.en = item.reports.en
    }
    if (isReport(item.reports.tr)) {
      reports.tr = item.reports.tr
    }
  }
  if (Object.keys(reports).length === 0 && item && isReport(item.report)) {
    const lang = item.language === 'tr' ? 'tr' : 'en'
    reports[lang] = item.report
  }
  return reports
}

function pickReport(reports, language) {
  if (language === 'tr' && reports.tr) {
    return { report: reports.tr, language: 'tr' }
  }
  if (language === 'en' && reports.en) {
    return { report: reports.en, language: 'en' }
  }
  if (reports.en) {
    return { report: reports.en, language: 'en' }
  }
  if (reports.tr) {
    return { report: reports.tr, language: 'tr' }
  }
  return { report: null, language: null }
}

async function initHistoryStore() {
  if (store) {
    return store
  }

  const { default: Store } = await import('electron-store')
  store = new Store({
    name: 'analysis-history',
    defaults: { items: [] },
  })
  return store
}

function getItems() {
  if (!store) {
    return []
  }
  const items = store.get('items', [])
  if (!Array.isArray(items)) {
    return []
  }
  let dirty = false
  const migrated = items.map((item) => {
    if (item && item.reports && typeof item.reports === 'object' && !item.report) {
      return item
    }
    dirty = true
    return {
      id: item.id,
      createdAt: item.createdAt,
      logText: item.logText,
      truncated: Boolean(item.truncated),
      reports: reportsOf(item),
    }
  })
  if (dirty) {
    persist(migrated)
  }
  return migrated
}

function persist(items) {
  store.set('items', items.slice(0, MAX_ITEMS))
}

function listHistory(language) {
  return getItems().map((item) => {
    const picked = pickReport(reportsOf(item), language)
    return {
      id: item.id,
      createdAt: item.createdAt,
      summary: picked.report?.summary ?? '',
    }
  })
}

function getHistoryItem(id, language) {
  const item = getItems().find((entry) => entry.id === id)
  if (!item) {
    return null
  }
  const reports = reportsOf(item)
  const picked = pickReport(reports, language)
  return {
    id: item.id,
    createdAt: item.createdAt,
    logText: item.logText,
    truncated: Boolean(item.truncated),
    report: picked.report,
    language: picked.language,
    hasLanguage: Boolean(language === 'tr' || language === 'en' ? reports[language] : picked.report),
  }
}

function saveHistoryItem({ logText, report, truncated, language }) {
  const items = getItems()
  const lang = language === 'tr' || language === 'en' ? language : 'en'
  const entry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    logText: typeof logText === 'string' ? logText.slice(0, MAX_LOG_CHARS) : '',
    truncated: Boolean(truncated),
    reports: { [lang]: report },
  }
  persist([entry, ...items])
  return entry.id
}

function updateHistoryItem(id, { report, truncated, language, logText }) {
  const items = getItems()
  const index = items.findIndex((item) => item.id === id)
  if (index === -1) {
    return saveHistoryItem({ logText, report, truncated, language })
  }
  const current = items[index]
  const reports = reportsOf(current)
  const lang = language === 'tr' || language === 'en' ? language : 'en'
  reports[lang] = report
  items[index] = {
    ...current,
    truncated: truncated === undefined ? Boolean(current.truncated) : Boolean(truncated),
    logText:
      typeof logText === 'string' ? logText.slice(0, MAX_LOG_CHARS) : current.logText,
    reports,
  }
  persist(items)
  return id
}

function missingReports(language) {
  if (language !== 'tr' && language !== 'en') {
    return []
  }
  return getItems()
    .map((item) => {
      const reports = reportsOf(item)
      if (reports[language] || (!reports.en && !reports.tr)) {
        return null
      }
      const source = language === 'tr' ? reports.en : reports.tr
      if (!source) {
        return null
      }
      return {
        id: item.id,
        summary: source.summary,
        rootCause: source.rootCause,
        steps: source.steps,
      }
    })
    .filter(Boolean)
}

function clearHistory() {
  if (!store) {
    return
  }
  store.set('items', [])
}

module.exports = {
  initHistoryStore,
  listHistory,
  getHistoryItem,
  saveHistoryItem,
  updateHistoryItem,
  missingReports,
  clearHistory,
}
