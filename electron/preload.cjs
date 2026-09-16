const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('logfarm', {
  analyze: (logText) => ipcRenderer.invoke('analyze-log', logText),
  cancelAnalyze: () => ipcRenderer.invoke('cancel-analyze'),
  getLanguage: () => ipcRenderer.invoke('language-get'),
  setLanguage: (language) => ipcRenderer.invoke('language-set', language),
  getApiKeyStatus: () => ipcRenderer.invoke('api-key-status'),
  saveApiKey: (key) => ipcRenderer.invoke('api-key-save', key),
  clearApiKey: () => ipcRenderer.invoke('api-key-clear'),
  listHistory: () => ipcRenderer.invoke('history-list'),
  getHistoryItem: (id) => ipcRenderer.invoke('history-get', id),
  clearHistory: () => ipcRenderer.invoke('history-clear'),
  getLicenseStatus: (validate) => ipcRenderer.invoke('license-status', Boolean(validate)),
  activateLicense: (key) => ipcRenderer.invoke('license-activate', key),
  clearLicense: () => ipcRenderer.invoke('license-clear'),
  openLicenseCheckout: () => ipcRenderer.invoke('license-buy'),
})
