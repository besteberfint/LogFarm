const os = require('os')
const { appError } = require('./errors.cjs')

const ACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/activate'
const VALIDATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/validate'
const DEACTIVATE_URL = 'https://api.lemonsqueezy.com/v1/licenses/deactivate'
const DEFAULT_CHECKOUT_URL =
  'https://logfarm.lemonsqueezy.com/checkout/buy/aa5ef5c0-0bea-4f3e-a1f4-5bdc800daf4c'
const REQUEST_TIMEOUT_MS = 20_000
const VALIDATE_TIMEOUT_MS = 8_000

function instanceName() {
  const host = os.hostname() || 'machine'
  return `LogFarm-${host}`.slice(0, 80)
}

function isLemonCheckoutUrl(value) {
  try {
    const parsed = new URL(value)
    return (
      parsed.protocol === 'https:' &&
      (parsed.hostname === 'lemonsqueezy.com' || parsed.hostname.endsWith('.lemonsqueezy.com'))
    )
  } catch {
    return false
  }
}

function checkoutUrl() {
  const fromEnv = process.env.LEMON_CHECKOUT_URL
  if (typeof fromEnv === 'string' && isLemonCheckoutUrl(fromEnv.trim())) {
    return fromEnv.trim()
  }
  return DEFAULT_CHECKOUT_URL
}

async function postLicense(url, fields, timeoutMs = REQUEST_TIMEOUT_MS) {
  const body = new URLSearchParams(fields)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
      signal: controller.signal,
    })
  } catch (error) {
    if (error && error.name === 'AbortError') {
      throw appError('errors.licenseTimeout')
    }
    throw appError('errors.licenseNetwork')
  } finally {
    clearTimeout(timeoutId)
  }

  let payload = null
  try {
    payload = await response.json()
  } catch {
    throw appError('errors.licenseUnreadable')
  }

  return { response, payload }
}

function mapLemonError(message, fallbackCode) {
  const lower = message.toLowerCase()
  if (lower.includes('activation limit')) {
    return appError('errors.licenseActivationLimit')
  }
  if (lower.includes('disabled')) {
    return appError('errors.licenseDisabled')
  }
  if (lower.includes('expired')) {
    return appError('errors.licenseExpired')
  }
  if (lower.includes('invalid') || lower.includes('not found')) {
    return appError('errors.licenseInvalid')
  }
  if (message) {
    return appError('errors.licenseApiDetail', { detail: message })
  }
  return appError(fallbackCode)
}

function licenseApiError(payload, fallbackCode) {
  const message = typeof payload?.error === 'string' ? payload.error.trim() : ''
  return mapLemonError(message, fallbackCode)
}

async function activateLicenseKey(licenseKey) {
  const { payload } = await postLicense(ACTIVATE_URL, {
    license_key: licenseKey,
    instance_name: instanceName(),
  })

  if (!payload || payload.activated !== true || !payload.instance?.id) {
    throw licenseApiError(payload, 'errors.licenseInvalid')
  }

  return {
    key: licenseKey,
    instanceId: String(payload.instance.id),
  }
}

async function validateLicenseKey(licenseKey, instanceId) {
  const fields = { license_key: licenseKey }
  if (instanceId) {
    fields.instance_id = instanceId
  }
  const { payload } = await postLicense(VALIDATE_URL, fields, VALIDATE_TIMEOUT_MS)
  if (payload && payload.valid === true) {
    return true
  }
  if (payload && payload.valid === false) {
    return false
  }
  throw licenseApiError(payload, 'errors.licenseUnreadable')
}

async function deactivateLicenseKey(licenseKey, instanceId) {
  if (!licenseKey || !instanceId) {
    return
  }
  try {
    await postLicense(DEACTIVATE_URL, {
      license_key: licenseKey,
      instance_id: instanceId,
    })
  } catch {
    // Yerel kaydı yine de silinebilsin.
  }
}

module.exports = {
  DEFAULT_CHECKOUT_URL,
  isLemonCheckoutUrl,
  checkoutUrl,
  activateLicenseKey,
  validateLicenseKey,
  deactivateLicenseKey,
}
