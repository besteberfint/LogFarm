const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')
const { appError } = require('./errors.cjs')

function licenseFilePath() {
  return path.join(app.getPath('userData'), 'license.bin')
}

function hasLicenseRecord() {
  try {
    return fs.existsSync(licenseFilePath())
  } catch {
    return false
  }
}

function saveLicenseRecord({ key, instanceId }) {
  const trimmed = typeof key === 'string' ? key.trim() : ''
  if (!trimmed) {
    throw appError('errors.licenseEmpty')
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw appError('errors.safeStorageUnavailable')
  }

  const payload = JSON.stringify({
    key: trimmed,
    instanceId: typeof instanceId === 'string' ? instanceId : '',
  })
  fs.writeFileSync(licenseFilePath(), safeStorage.encryptString(payload))
}

function loadLicenseRecord() {
  if (!hasLicenseRecord()) {
    return null
  }
  if (!safeStorage.isEncryptionAvailable()) {
    throw appError('errors.safeStorageDecrypt')
  }

  const raw = safeStorage.decryptString(fs.readFileSync(licenseFilePath()))
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.key !== 'string') {
      return null
    }
    return {
      key: parsed.key,
      instanceId: typeof parsed.instanceId === 'string' ? parsed.instanceId : '',
    }
  } catch {
    return null
  }
}

function clearLicenseRecord() {
  if (hasLicenseRecord()) {
    fs.unlinkSync(licenseFilePath())
  }
}

module.exports = {
  hasLicenseRecord,
  saveLicenseRecord,
  loadLicenseRecord,
  clearLicenseRecord,
}
