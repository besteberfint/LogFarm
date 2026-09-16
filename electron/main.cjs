const { app, BrowserWindow, ipcMain, shell, nativeImage } = require('electron')
const path = require('path')
const { loadEnvFile } = require('./loadEnv.cjs')
const { analyzeWithClaude, cancelActiveAnalysis } = require('./claude.cjs')
const { hasStoredKey, saveStoredKey, clearStoredKey } = require('./keyStore.cjs')
const { toErrorPayload } = require('./errors.cjs')
const {
  initSettingsStore,
  getLanguage,
  setLanguage,
} = require('./settingsStore.cjs')
const {
  checkoutUrl,
  isLemonCheckoutUrl,
} = require('./lemonLicense.cjs')
const {
  getLicenseStatus,
  ensureLicenseFresh,
  assertCanAnalyze,
  recordSuccessfulAnalysis,
  activateLicense,
  clearLicense,
} = require('./licenseGate.cjs')
const {
  initHistoryStore,
  listHistory,
  getHistoryItem,
  saveHistoryItem,
  clearHistory,
} = require('./historyStore.cjs')

loadEnvFile()

const ICON_PATH = path.join(__dirname, 'icon.ico')
const ICON_PNG_PATH = path.join(__dirname, 'icon.png')

// Windows görev çubuğu, bu ID yoksa electron.exe ikonuna yapışır.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.logfarm.app')
}

function windowIcon() {
  const fromPng = nativeImage.createFromPath(ICON_PNG_PATH)
  if (!fromPng.isEmpty()) {
    return fromPng
  }
  return ICON_PATH
}

function createWindow() {
  const icon = windowIcon()
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.setIcon(icon)

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isLemonCheckoutUrl(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })

  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  } else {
    win.loadURL('http://localhost:5173')
  }
}

ipcMain.handle('analyze-log', async (_event, logText) => {
  try {
    await initSettingsStore()
    assertCanAnalyze()
    const { report, truncated } = await analyzeWithClaude(logText)
    try {
      await initHistoryStore()
      saveHistoryItem({ logText, report, truncated })
    } catch {
      // Geçmiş yazılamazsa analizi yine de döndür.
    }
    const license = recordSuccessfulAnalysis()
    return { ok: true, report, truncated, license }
  } catch (error) {
    if (error && error.name === 'AnalysisCancelledError') {
      return { ok: false, cancelled: true }
    }
    return toErrorPayload(error, 'errors.analyzeFailed')
  }
})

ipcMain.handle('cancel-analyze', () => {
  cancelActiveAnalysis()
  return { ok: true }
})

ipcMain.handle('language-get', async () => {
  try {
    await initSettingsStore()
    return { ok: true, language: getLanguage() }
  } catch (error) {
    return toErrorPayload(error, 'errors.languageReadFailed')
  }
})

ipcMain.handle('language-set', async (_event, language) => {
  try {
    await initSettingsStore()
    return { ok: true, language: setLanguage(language) }
  } catch (error) {
    return toErrorPayload(error, 'errors.languageSaveFailed')
  }
})

ipcMain.handle('license-status', async (_event, validate) => {
  try {
    await initSettingsStore()
    if (validate) {
      await ensureLicenseFresh()
    }
    return { ok: true, ...getLicenseStatus() }
  } catch (error) {
    return toErrorPayload(error, 'errors.licenseStatusFailed')
  }
})

ipcMain.handle('license-buy', async () => {
  try {
    const url = checkoutUrl()
    if (!isLemonCheckoutUrl(url)) {
      throw new Error('checkout url rejected')
    }
    await shell.openExternal(url)
    return { ok: true }
  } catch (error) {
    return toErrorPayload(error, 'errors.licenseBuyFailed')
  }
})

ipcMain.handle('license-activate', async (_event, key) => {
  try {
    await initSettingsStore()
    return { ok: true, ...await activateLicense(key) }
  } catch (error) {
    return toErrorPayload(error, 'errors.licenseActivateFailed')
  }
})

ipcMain.handle('license-clear', async () => {
  try {
    await initSettingsStore()
    return { ok: true, ...await clearLicense() }
  } catch (error) {
    return toErrorPayload(error, 'errors.licenseClearFailed')
  }
})

ipcMain.handle('api-key-status', () => {
  try {
    return { ok: true, configured: hasStoredKey() }
  } catch (error) {
    return toErrorPayload(error, 'errors.keyStatusFailed')
  }
})

ipcMain.handle('api-key-save', (_event, key) => {
  try {
    saveStoredKey(key)
    return { ok: true, configured: true }
  } catch (error) {
    return toErrorPayload(error, 'errors.keySaveFailed')
  }
})

ipcMain.handle('api-key-clear', () => {
  try {
    clearStoredKey()
    return { ok: true, configured: false }
  } catch (error) {
    return toErrorPayload(error, 'errors.keyClearFailed')
  }
})

ipcMain.handle('history-list', async () => {
  try {
    await initHistoryStore()
    return { ok: true, items: listHistory() }
  } catch (error) {
    return toErrorPayload(error, 'errors.historyReadFailed')
  }
})

ipcMain.handle('history-get', async (_event, id) => {
  try {
    await initHistoryStore()
    const item = getHistoryItem(id)
    if (!item) {
      return { ok: false, code: 'errors.historyNotFound' }
    }
    return { ok: true, item }
  } catch (error) {
    return toErrorPayload(error, 'errors.historyReadFailed')
  }
})

ipcMain.handle('history-clear', async () => {
  try {
    await initHistoryStore()
    clearHistory()
    return { ok: true }
  } catch (error) {
    return toErrorPayload(error, 'errors.historyClearFailed')
  }
})

app.whenReady().then(async () => {
  try {
    await initSettingsStore()
  } catch {
    // Ayar deposu açılmazsa varsayılan dil kullanılır.
  }

  try {
    await initHistoryStore()
  } catch {
    // Geçmiş deposu yoksa uygulama yine açılsın.
  }
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
