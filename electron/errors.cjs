// Ana süreç kullanıcıya hazır metin döndürmez; arayüzün çevireceği kod döndürür.
// Buradaki her kod src/i18n/translations.ts içinde aynı adla bulunmalı.

function appError(code, params) {
  const error = new Error(code)
  error.appCode = code
  if (params) {
    error.appParams = params
  }
  return error
}

function toErrorPayload(error, fallbackCode) {
  if (error && error.appCode) {
    return error.appParams
      ? { ok: false, code: error.appCode, params: error.appParams }
      : { ok: false, code: error.appCode }
  }

  const detail = error instanceof Error && error.message ? error.message : ''
  return detail ? { ok: false, code: fallbackCode, detail } : { ok: false, code: fallbackCode }
}

module.exports = { appError, toErrorPayload }
