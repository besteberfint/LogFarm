const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')
const { appError } = require('./errors.cjs')

function keyFilePath() {
  return path.join(app.getPath('userData'), 'api-key.bin')
}

function hasStoredKey() {
  try {
    return fs.existsSync(keyFilePath())
  } catch {
    return false
  }
}

const MAX_KEY_CHARS = 300

function saveStoredKey(plainKey) {
  const trimmed = typeof plainKey === 'string' ? plainKey.trim() : ''
  if (!trimmed) {
    throw appError('errors.keySaveEmpty')
  }
  if (trimmed.length > MAX_KEY_CHARS || !trimmed.startsWith('sk-ant-')) {
    throw appError('errors.keyFormat')
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw appError('errors.safeStorageUnavailable')
  }

  const encrypted = safeStorage.encryptString(trimmed)
  fs.writeFileSync(keyFilePath(), encrypted)
}

function loadStoredKey() {
  if (!hasStoredKey()) {
    return ''
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw appError('errors.safeStorageDecrypt')
  }

  const encrypted = fs.readFileSync(keyFilePath())
  return safeStorage.decryptString(encrypted)
}

function clearStoredKey() {
  if (hasStoredKey()) {
    fs.unlinkSync(keyFilePath())
  }
}

module.exports = {
  hasStoredKey,
  saveStoredKey,
  loadStoredKey,
  clearStoredKey,
}
