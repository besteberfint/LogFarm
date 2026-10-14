const { app, BrowserWindow, ipcMain, session, shell, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')
const { loadEnvFile } = require('./loadEnv.cjs')
const { analyzeWithClaude, cancelActiveAnalysis, translateReports } = require('./claude.cjs')
const { hasStoredKey, saveStoredKey, clearStoredKey } = require('./keyStore.cjs')
const { appError, toErrorPayload } = require('./errors.cjs')
const { installProcessGuard } = require('./processGuard.cjs')
const { isAllowedAppUrl } = require('./shellGuard.cjs')
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
  updateHistoryItem,
  missingReports,
  clearHistory,
} = require('./historyStore.cjs')

loadEnvFile()

function notifyUnexpected(payload) {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) {
      win.webContents.send('app-error', payload)
    }
  }
}

installProcessGuard({ notify: notifyUnexpected })

const MAX_LOG_INPUT_CHARS = 2_000_000
const CLIPBOARD_PERMISSIONS = new Set(['clipboard-sanitized-write', 'clipboard-write'])

// Aynı userData klasörünü iki pencere birden yazmasın.
const gotSingleInstanceLock = app.requestSingleInstanceLock()
if (!gotSingleInstanceLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) {
      return
    }
    if (win.isMinimized()) {
      win.restore()
    }
    win.show()
    win.focus()
  })
}

function appPageUrlAllowed(url) {
  return isAllowedAppUrl(url, {
    packaged: app.isPackaged,
    appRoot: path.join(__dirname, '../dist'),
  })
}

function hardenContents(contents) {
  contents.on('will-navigate', (event, url) => {
    if (!appPageUrlAllowed(url)) {
      event.preventDefault()
    }
  })
  contents.on('will-redirect', (event, url) => {
    if (!appPageUrlAllowed(url)) {
      event.preventDefault()
    }
  })
  contents.on('will-attach-webview', (event) => {
    event.preventDefault()
  })
}

function hardenSession() {
  const ses = session.defaultSession
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(CLIPBOARD_PERMISSIONS.has(permission))
  })
  ses.setPermissionCheckHandler((_webContents, permission) => CLIPBOARD_PERMISSIONS.has(permission))
}

function assertLogInput(logText) {
  if (typeof logText !== 'string' || !logText.trim()) {
    throw appError('errors.logEmpty')
  }
  if (logText.length > MAX_LOG_INPUT_CHARS) {
    throw appError('errors.logTooLarge')
  }
}

app.on('web-contents-created', (_event, contents) => {
  hardenContents(contents)
})

// Yeni dosya adı: Windows, üzerine yazılan icon.ico yolunu önbellekte tutar.
const ICON_PATH = path.join(__dirname, 'lf-icon.ico')
const ICON_PNG_PATH = path.join(__dirname, 'icon.png')
const APP_USER_MODEL_ID = 'com.logfarm.app.filled'

// Windows görev çubuğu, bu ID yoksa electron.exe ikonuna yapışır.
if (process.platform === 'win32') {
  app.setAppUserModelId(APP_USER_MODEL_ID)
}

function windowIcon() {
  // Görev çubuğu .ico dosya yolunu ister; nativeImage tek kareye düşüp eski
  // önbelleğe yapışabiliyor.
  if (fs.existsSync(ICON_PATH)) {
    return ICON_PATH
  }
  const fromIco = nativeImage.createFromPath(path.join(__dirname, 'icon.ico'))
  if (!fromIco.isEmpty()) {
    return fromIco
  }
  return nativeImage.createFromPath(ICON_PNG_PATH)
}

function createWindow() {
  const icon = windowIcon()
  const win = new BrowserWindow({
    width: 1100,
    height: 720,
    show: false,
    backgroundColor: '#08150f',
    icon,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      nodeIntegrationInSubFrames: false,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      navigateOnDragDrop: false,
      webviewTag: false,
    },
  })

  win.setIcon(icon)
  if (process.platform === 'win32' && typeof icon === 'string') {
    win.setAppDetails({
      appId: APP_USER_MODEL_ID,
      appIconPath: icon,
      appIconIndex: 0,
      relaunchDisplayName: 'LogFarm',
    })
  }
  win.once('ready-to-show', () => {
    win.show()
  })
  // ready-to-show gelmezse pencere hiç açılmasın diye yedek.
  setTimeout(() => {
    if (!win.isDestroyed() && !win.isVisible()) {
      win.show()
    }
  }, 4000)

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

ipcMain.handle('analyze-log', async (_event, logText, language) => {
  try {
    await initSettingsStore()
    assertLogInput(logText)
    assertCanAnalyze()
    const { report, truncated, language: reportLanguage } = await analyzeWithClaude(
      logText,
      language,
    )
    let historyId = null
    try {
      await initHistoryStore()
      historyId = saveHistoryItem({ logText, report, truncated, language: reportLanguage })
    } catch {
      // Geçmiş yazılamazsa analizi yine de döndür.
    }
    const license = recordSuccessfulAnalysis()
    return {
      ok: true,
      report,
      truncated,
      language: reportLanguage,
      license,
      historyId,
    }
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

const SUPPORT_MAIL_URL =
  'https://mail.google.com/mail/?view=cm&fs=1&to=logfarm.support%40gmail.com&su=LogFarm'

ipcMain.handle('support-mail', async () => {
  try {
    await shell.openExternal(SUPPORT_MAIL_URL)
    return { ok: true }
  } catch (error) {
    return toErrorPayload(error, 'errors.supportMailFailed')
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

function requestedLanguage(language) {
  if (language === 'tr' || language === 'en') {
    return language
  }
  return getLanguage()
}

function toHistoryRecord(item) {
  if (!item || !item.report) {
    return null
  }
  return {
    id: item.id,
    createdAt: item.createdAt,
    logText: item.logText,
    report: item.report,
    truncated: item.truncated,
    language: item.language,
    hasLanguage: item.hasLanguage,
  }
}

ipcMain.handle('history-list', async (_event, language) => {
  try {
    await initSettingsStore()
    await initHistoryStore()
    return {
      ok: true,
      items: listHistory(requestedLanguage(language)),
      missingCount: missingReports(requestedLanguage(language)).length,
    }
  } catch (error) {
    return toErrorPayload(error, 'errors.historyReadFailed')
  }
})

ipcMain.handle('history-get', async (_event, id, language) => {
  try {
    await initSettingsStore()
    await initHistoryStore()
    const item = toHistoryRecord(getHistoryItem(id, requestedLanguage(language)))
    if (!item) {
      return { ok: false, code: 'errors.historyNotFound' }
    }
    return { ok: true, item }
  } catch (error) {
    return toErrorPayload(error, 'errors.historyReadFailed')
  }
})

ipcMain.handle('history-localize', async (_event, language, itemId) => {
  try {
    await initSettingsStore()
    await initHistoryStore()
    const lang = requestedLanguage(language)
    const missing = missingReports(lang)
    if (missing.length > 0) {
      assertCanAnalyze()
      let canTranslate = false
      try {
        canTranslate = hasStoredKey()
      } catch {
        canTranslate = false
      }
      if (!canTranslate) {
        const envKey = process.env.ANTHROPIC_API_KEY
        canTranslate = typeof envKey === 'string' && envKey.trim().length > 0
      }
      if (canTranslate) {
        const translated = await translateReports(missing, lang)
        for (const entry of translated) {
          updateHistoryItem(entry.id, { report: entry.report, language: lang })
        }
      }
    }
    return {
      ok: true,
      items: listHistory(lang),
      item: itemId ? toHistoryRecord(getHistoryItem(itemId, lang)) : null,
    }
  } catch (error) {
    if (error && error.name === 'AnalysisCancelledError') {
      return { ok: false, cancelled: true }
    }
    try {
      await initHistoryStore()
      const lang = requestedLanguage(language)
      return {
        ok: true,
        items: listHistory(lang),
        item: itemId ? toHistoryRecord(getHistoryItem(itemId, lang)) : null,
        localizeError: toErrorPayload(error, 'errors.historyReadFailed'),
      }
    } catch {
      return toErrorPayload(error, 'errors.historyReadFailed')
    }
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
  installProcessGuard({ notify: notifyUnexpected })
  if (!gotSingleInstanceLock) {
    return
  }

  hardenSession()

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
