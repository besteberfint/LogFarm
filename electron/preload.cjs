const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('logfarm', {
  analyze: (logText, language) => ipcRenderer.invoke('analyze-log', logText, language),
  cancelAnalyze: () => ipcRenderer.invoke('cancel-analyze'),
  getLanguage: () => ipcRenderer.invoke('language-get'),
  setLanguage: (language) => ipcRenderer.invoke('language-set', language),
  getApiKeyStatus: () => ipcRenderer.invoke('api-key-status'),
  saveApiKey: (key) => ipcRenderer.invoke('api-key-save', key),
  clearApiKey: () => ipcRenderer.invoke('api-key-clear'),
  listHistory: (language) => ipcRenderer.invoke('history-list', language),
  getHistoryItem: (id, language) => ipcRenderer.invoke('history-get', id, language),
  localizeHistory: (language, itemId) =>
    ipcRenderer.invoke('history-localize', language, itemId),
  clearHistory: () => ipcRenderer.invoke('history-clear'),
  getLicenseStatus: (validate) => ipcRenderer.invoke('license-status', Boolean(validate)),
  activateLicense: (key) => ipcRenderer.invoke('license-activate', key),
  clearLicense: () => ipcRenderer.invoke('license-clear'),
  openLicenseCheckout: () => ipcRenderer.invoke('license-buy'),
  openSupportMail: () => ipcRenderer.invoke('support-mail'),
  onUnexpectedError: (callback) => {
    if (typeof callback !== 'function') {
      return () => {}
    }
    const listener = (_event, payload) => {
      callback(payload)
    }
    ipcRenderer.on('app-error', listener)
    return () => {
      ipcRenderer.removeListener('app-error', listener)
    }
  },
})
