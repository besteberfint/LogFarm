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
    defaults: { language: DEFAULT_LANGUAGE, trialUsed: 0 },
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

function getTrialUsed() {
  if (!store) {
    return 0
  }
  const value = store.get('trialUsed', 0)
  return Number.isInteger(value) && value > 0 ? value : 0
}

function incrementTrialUsed() {
  if (!store) {
    return 0
  }
  const next = getTrialUsed() + 1
  store.set('trialUsed', next)
  return next
}

module.exports = {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  initSettingsStore,
  getLanguage,
  setLanguage,
  getTrialUsed,
  incrementTrialUsed,
}
