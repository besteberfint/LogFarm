const { appError } = require('./errors.cjs')

const DEFAULT_LANGUAGE = 'en'
const SUPPORTED_LANGUAGES = ['en', 'tr']

let store = null

async function initSettingsStore() {
  if (store) {
    return store
  }

  const { default: Store } = await import('electron-store')
  store = new Store({
    name: 'settings',
    defaults: { language: DEFAULT_LANGUAGE },
  })
  return store
}

// Depo henüz açılmadıysa varsayılana düşer; analiz akışı bunun için beklemez.
function getLanguage() {
  const value = store ? store.get('language', DEFAULT_LANGUAGE) : DEFAULT_LANGUAGE
  return SUPPORTED_LANGUAGES.includes(value) ? value : DEFAULT_LANGUAGE
}

function setLanguage(language) {
  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw appError('errors.languageUnsupported')
  }
  store.set('language', language)
  return language
}

module.exports = {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  initSettingsStore,
  getLanguage,
  setLanguage,
}
