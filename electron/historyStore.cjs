const { randomUUID } = require('crypto')

const MAX_ITEMS = 20
const MAX_LOG_CHARS = 80_000

let store = null

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
  return Array.isArray(items) ? items : []
}

function listHistory() {
  return getItems().map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    summary: item.report?.summary ?? '',
  }))
}

function getHistoryItem(id) {
  return getItems().find((item) => item.id === id) ?? null
}

function saveHistoryItem({ logText, report, truncated }) {
  const items = getItems()
  const entry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    logText: typeof logText === 'string' ? logText.slice(0, MAX_LOG_CHARS) : '',
    report,
    truncated: Boolean(truncated),
  }
  store.set('items', [entry, ...items].slice(0, MAX_ITEMS))
  return entry.id
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
  clearHistory,
}
