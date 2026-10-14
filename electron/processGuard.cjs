const { toErrorPayload } = require('./errors.cjs')

function safeProcessError(error) {
  if (error && typeof error === 'object' && typeof error.appCode === 'string') {
    const payload = toErrorPayload(error, 'errors.unexpected')
    if (typeof payload.code === 'string' && payload.code.startsWith('errors.')) {
      return payload.params ? { code: payload.code, params: payload.params } : { code: payload.code }
    }
  }
  return { code: 'errors.unexpected' }
}

function installProcessGuard({ log = console.error, notify } = {}) {
  function report(kind, error) {
    const payload = safeProcessError(error)
    log(kind, payload.code)
    if (typeof notify === 'function') {
      try {
        notify(payload)
      } catch {
        // Bildirim kendisi düşerse konsola sır yazma.
      }
    }
  }

  process.removeAllListeners('uncaughtException')
  process.removeAllListeners('unhandledRejection')
  process.on('uncaughtException', (error) => {
    report('uncaughtException', error)
  })
  process.on('unhandledRejection', (reason) => {
    report('unhandledRejection', reason)
  })
}

module.exports = { installProcessGuard, safeProcessError }
