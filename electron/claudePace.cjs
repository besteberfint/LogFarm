const { appError } = require('./errors.cjs')

const MIN_GAP_MS = 1500

function createClaudePace(now = Date.now) {
  let busy = false
  let nextAllowedAt = 0

  function begin() {
    if (busy) {
      throw appError('errors.busy')
    }
    busy = true
  }

  function end() {
    busy = false
  }

  function markAttempt() {
    nextAllowedAt = now() + MIN_GAP_MS
  }

  function gapMs() {
    return Math.max(0, nextAllowedAt - now())
  }

  return { begin, end, markAttempt, gapMs }
}

module.exports = { MIN_GAP_MS, createClaudePace }
