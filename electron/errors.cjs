// Ana süreç kullanıcıya hazır metin döndürmez; arayüzün çevireceği kod döndürür.
// Buradaki her kod src/i18n/translations.ts içinde aynı adla bulunmalı.

function scrubDetail(value) {
  if (typeof value !== 'string') {
    return ''
  }

  return value
    .replace(/sk-ant-[A-Za-z0-9_-]+/gi, '[redacted]')
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, '[redacted]')
    .replace(/Bearer\s+\S+/gi, 'Bearer [redacted]')
    .replace(
      /\b[0-9A-Fa-f]{8}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{4}-[0-9A-Fa-f]{12}\b/g,
      '[redacted]',
    )
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 300)
}

function safeParams(params) {
  if (!params || typeof params !== 'object') {
    return params
  }

  const safe = { ...params }
  if (typeof safe.detail === 'string') {
    safe.detail = scrubDetail(safe.detail)
  }
  return safe
}

function appError(code, params) {
  const error = new Error(code)
  error.appCode = code
  if (params) {
    error.appParams = safeParams(params)
  }
  return error
}

function toErrorPayload(error, fallbackCode) {
  if (error && error.appCode) {
    return error.appParams
      ? { ok: false, code: error.appCode, params: error.appParams }
      : { ok: false, code: error.appCode }
  }

  const detail = scrubDetail(error instanceof Error ? error.message : '')
  return detail ? { ok: false, code: fallbackCode, detail } : { ok: false, code: fallbackCode }
}

module.exports = { appError, toErrorPayload, scrubDetail }
