const fs = require('fs')
const path = require('path')
const { appError } = require('./errors.cjs')
const {
  hasLicenseRecord,
  saveLicenseRecord,
  loadLicenseRecord,
  clearLicenseRecord,
} = require('./licenseStore.cjs')
const {
  activateLicenseKey,
  validateLicenseKey,
  deactivateLicenseKey,
} = require('./lemonLicense.cjs')
const { getTrialUsed, incrementTrialUsed } = require('./settingsStore.cjs')

const TRIAL_LIMIT = 3

let validatedThisSession = false

function envFlag(name) {
  const value = process.env[name]
  if (typeof value !== 'string') {
    return null
  }
  const trimmed = value.trim().toLowerCase()
  if (trimmed === 'true' || trimmed === '1') {
    return true
  }
  if (trimmed === 'false' || trimmed === '0') {
    return false
  }
  return null
}

function packagedTestUnlock() {
  try {
    const flagPath = path.join(process.resourcesPath, 'test-unlock.json')
    if (!fs.existsSync(flagPath)) {
      return false
    }
    const data = JSON.parse(fs.readFileSync(flagPath, 'utf8'))
    return data.devUnlock === true
  } catch {
    return false
  }
}

function isDevUnlocked() {
  if (packagedTestUnlock()) {
    return true
  }
  const flag = envFlag('DEV_UNLOCK')
  if (flag !== null) {
    return flag
  }
  return false
}

function normalizeLicenseKey(raw) {
  if (typeof raw !== 'string') {
    return ''
  }
  return raw.replace(/\s+/g, '')
}

function getLicenseStatus() {
  const unlocked = isDevUnlocked()
  const licensed = !unlocked && hasLicenseRecord()
  const trialUsed = getTrialUsed()
  const remaining = Math.max(0, TRIAL_LIMIT - trialUsed)
  const locked = !unlocked && !licensed && remaining === 0

  return {
    unlocked,
    licensed,
    locked,
    trialUsed,
    trialLimit: TRIAL_LIMIT,
    remaining,
  }
}

function assertCanAnalyze() {
  const status = getLicenseStatus()
  if (status.locked) {
    throw appError('errors.licenseRequired', {
      used: status.trialUsed,
      max: status.trialLimit,
    })
  }
}

function recordSuccessfulAnalysis() {
  const status = getLicenseStatus()
  if (status.unlocked || status.licensed) {
    return getLicenseStatus()
  }
  incrementTrialUsed()
  return getLicenseStatus()
}

async function ensureLicenseFresh() {
  if (validatedThisSession) {
    return
  }
  validatedThisSession = true

  let record
  try {
    record = loadLicenseRecord()
  } catch {
    return
  }
  if (!record?.key) {
    return
  }

  try {
    const valid = await validateLicenseKey(record.key, record.instanceId)
    if (!valid) {
      clearLicenseRecord()
    }
  } catch {
    // Ağ yoksa veya yanıt belirsizse yerel kayıt kalır.
  }
}

async function activateLicense(rawKey) {
  const key = normalizeLicenseKey(rawKey)
  if (!key) {
    throw appError('errors.licenseEmpty')
  }

  const record = await activateLicenseKey(key)
  saveLicenseRecord(record)
  validatedThisSession = true
  return getLicenseStatus()
}

async function clearLicense() {
  try {
    const record = loadLicenseRecord()
    if (record) {
      await deactivateLicenseKey(record.key, record.instanceId)
    }
  } catch {
    // Lemon Squeezy ulaşılamazsa yerel kaydı yine sil.
  }
  clearLicenseRecord()
  validatedThisSession = false
  return getLicenseStatus()
}

module.exports = {
  TRIAL_LIMIT,
  isDevUnlocked,
  getLicenseStatus,
  ensureLicenseFresh,
  assertCanAnalyze,
  recordSuccessfulAnalysis,
  activateLicense,
  clearLicense,
}
