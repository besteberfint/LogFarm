const { buildSystemPrompt } = require('./prompt.cjs')
const { loadEnvFile } = require('./loadEnv.cjs')
const { loadStoredKey } = require('./keyStore.cjs')
const { getLanguage } = require('./settingsStore.cjs')
const { appError } = require('./errors.cjs')

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-5'
const MAX_TOKENS = 1024
const MAX_LOG_CHARS = 80_000
const HEAD_CHARS = 40_000
const TAIL_CHARS = 40_000
const REQUEST_TIMEOUT_MS = 60_000

let activeController = null
let abortReason = null
let timeoutId = null

function truncateLog(logText) {
  if (logText.length <= MAX_LOG_CHARS) {
    return logText
  }

  const omitted = logText.length - HEAD_CHARS - TAIL_CHARS
  return `${logText.slice(0, HEAD_CHARS)}\n\n[... truncated ${omitted} characters ...]\n\n${logText.slice(-TAIL_CHARS)}`
}

function extractText(payload) {
  if (!payload || !Array.isArray(payload.content)) {
    throw appError('errors.responseFormat')
  }

  const text = payload.content
    .filter((block) => block && block.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw appError('errors.emptyResponse')
  }

  return text
}

function tryParseJson(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function parseReport(rawText) {
  const stripped = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()

  let parsed = tryParseJson(stripped)
  if (!parsed) {
    const start = stripped.indexOf('{')
    const end = stripped.lastIndexOf('}')
    if (start !== -1 && end > start) {
      parsed = tryParseJson(stripped.slice(start, end + 1))
    }
  }

  if (!parsed) {
    throw appError('errors.invalidJson')
  }

  if (
    typeof parsed.summary !== 'string' ||
    typeof parsed.rootCause !== 'string' ||
    !Array.isArray(parsed.steps) ||
    parsed.steps.length === 0 ||
    parsed.steps.some((step) => typeof step !== 'string')
  ) {
    throw appError('errors.incompleteReport')
  }

  return {
    summary: parsed.summary.trim(),
    rootCause: parsed.rootCause.trim(),
    steps: parsed.steps.map((step) => step.trim()).filter(Boolean),
  }
}

function readAnthropicError(bodyText) {
  const body = tryParseJson(bodyText)
  if (!body || typeof body !== 'object') {
    return { type: '', message: '' }
  }

  const type = typeof body.error?.type === 'string' ? body.error.type : ''
  const message = typeof body.error?.message === 'string' ? body.error.message : ''
  return { type, message }
}

function looksLikeCreditError(type, message) {
  const combined = `${type} ${message}`.toLowerCase()
  return (
    combined.includes('credit') ||
    combined.includes('balance') ||
    combined.includes('billing') ||
    combined.includes('quota') ||
    combined.includes('plan')
  )
}

function httpError(status, bodyText, retryAfterHeader) {
  const { type, message } = readAnthropicError(bodyText)

  if (type === 'authentication_error' || status === 401) {
    return appError('errors.keyInvalid')
  }

  if (looksLikeCreditError(type, message) || status === 402) {
    return appError('errors.credit')
  }

  if (type === 'permission_error' || status === 403) {
    return appError('errors.permission')
  }

  if (type === 'not_found_error' || status === 404) {
    return appError('errors.modelNotFound')
  }

  if (type === 'request_too_large' || status === 413) {
    return appError('errors.requestTooLarge')
  }

  if (type === 'rate_limit_error' || status === 429) {
    const waitSeconds = Number.parseInt(String(retryAfterHeader || ''), 10)
    if (Number.isFinite(waitSeconds) && waitSeconds > 0) {
      return appError('errors.rateLimitWait', { seconds: waitSeconds })
    }
    return appError('errors.rateLimit')
  }

  if (type === 'overloaded_error' || status === 529) {
    return appError('errors.overloaded')
  }

  if (status >= 500) {
    return appError('errors.serverDown')
  }

  if (type === 'invalid_request_error' || status === 400) {
    if (message) {
      return appError('errors.invalidRequestDetail', { detail: message })
    }
    return appError('errors.invalidRequest')
  }

  if (message) {
    return appError('errors.requestFailedDetail', { status, detail: message })
  }

  return appError('errors.requestFailed', { status })
}

function networkError(error) {
  const code = error?.cause?.code || error?.code
  if (code === 'ENOTFOUND' || code === 'EAI_AGAIN') {
    return appError('errors.networkDns')
  }
  if (
    code === 'ECONNREFUSED' ||
    code === 'ECONNRESET' ||
    code === 'ETIMEDOUT' ||
    code === 'UND_ERR_CONNECT_TIMEOUT'
  ) {
    return appError('errors.networkConnect')
  }
  return appError('errors.networkUnreachable')
}

function clearRequestTimeout() {
  if (timeoutId !== null) {
    clearTimeout(timeoutId)
    timeoutId = null
  }
}

function cancelActiveAnalysis(reason = 'user') {
  abortReason = reason
  clearRequestTimeout()
  if (activeController) {
    activeController.abort()
    activeController = null
  }
}

function isAbortError(error) {
  return Boolean(
    error &&
      (error.name === 'AbortError' ||
        error.name === 'AnalysisCancelledError' ||
        error.code === 20),
  )
}

function getApiKey() {
  try {
    const stored = loadStoredKey()
    if (stored) {
      return stored.trim()
    }
  } catch (error) {
    if (error && error.appCode) {
      throw error
    }
  }

  loadEnvFile()
  const apiKey = process.env.ANTHROPIC_API_KEY
  return typeof apiKey === 'string' ? apiKey.trim() : ''
}

async function analyzeWithClaude(logText) {
  const apiKey = getApiKey()

  if (!apiKey) {
    throw appError('errors.keyMissing')
  }

  if (!apiKey.startsWith('sk-ant-')) {
    throw appError('errors.keyFormat')
  }

  const trimmed = typeof logText === 'string' ? logText.trim() : ''
  if (!trimmed) {
    throw appError('errors.logEmpty')
  }

  const language = getLanguage()

  cancelActiveAnalysis()
  abortReason = null
  activeController = new AbortController()
  const { signal } = activeController
  timeoutId = setTimeout(() => {
    cancelActiveAnalysis('timeout')
  }, REQUEST_TIMEOUT_MS)

  let response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: buildSystemPrompt(language),
        messages: [
          {
            role: 'user',
            content: truncateLog(trimmed),
          },
        ],
      }),
    })
  } catch (error) {
    if (signal.aborted || isAbortError(error)) {
      if (abortReason === 'timeout') {
        throw appError('errors.timeout')
      }
      const cancelled = new Error('cancelled')
      cancelled.name = 'AnalysisCancelledError'
      throw cancelled
    }
    throw networkError(error)
  } finally {
    clearRequestTimeout()
    if (activeController?.signal === signal) {
      activeController = null
    }
  }

  const bodyText = await response.text()

  if (!response.ok) {
    throw httpError(response.status, bodyText, response.headers.get('retry-after'))
  }

  let payload
  try {
    payload = JSON.parse(bodyText)
  } catch {
    throw appError('errors.responseUnreadable')
  }

  const report = parseReport(extractText(payload))
  return {
    report,
    truncated: trimmed.length > MAX_LOG_CHARS,
    language,
  }
}

module.exports = { analyzeWithClaude, cancelActiveAnalysis }
