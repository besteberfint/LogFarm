const { appError } = require('./errors.cjs')

const MAX_LOG_CHARS = 80_000
const HEAD_CHARS = 40_000
const TAIL_CHARS = 40_000
const REPORT_TOOL_NAME = 'submit_report'

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

function foldKey(name) {
  return String(name)
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'i')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
}

const SUMMARY_KEYS = new Set(['summary', 'ozet', 'ozeti', 'resume'])
const ROOT_KEYS = new Set([
  'rootcause',
  'rootcauseanalysis',
  'kokneden',
  'neden',
  'cause',
])
const STEP_KEYS = new Set([
  'steps',
  'adimlar',
  'adim',
  'cozum',
  'cozumadimlari',
  'actions',
  'fixes',
])

function valueByFoldedKeys(source, wanted) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return undefined
  }
  for (const [key, value] of Object.entries(source)) {
    if (wanted.has(foldKey(key))) {
      return value
    }
  }
  return undefined
}

function coerceString(value) {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return value.map(coerceString).filter(Boolean).join(' ')
  }
  if (value && typeof value === 'object') {
    const nested =
      coerceString(value.text) ||
      coerceString(value.value) ||
      coerceString(value.content) ||
      coerceString(value.message) ||
      coerceString(value.summary) ||
      coerceString(value.rootCause)
    if (nested) {
      return nested
    }
    for (const inner of Object.values(value)) {
      const text = coerceString(inner)
      if (text) {
        return text
      }
    }
  }
  return ''
}

function coerceSteps(value) {
  if (Array.isArray(value)) {
    return value.map(coerceString).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split(/\n+/)
      .map((line) => line.replace(/^\s*(?:\d+[.)]|[-*•])\s*/, '').trim())
      .filter(Boolean)
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((left, right) => {
        const a = Number.parseInt(left, 10)
        const b = Number.parseInt(right, 10)
        if (Number.isFinite(a) && Number.isFinite(b) && a !== b) {
          return a - b
        }
        return String(left).localeCompare(String(right))
      })
      .map((key) => coerceString(value[key]))
      .filter(Boolean)
  }
  return []
}

function unwrapReport(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return parsed
  }
  if (parsed.report && typeof parsed.report === 'object') {
    return parsed.report
  }
  if (parsed.input && typeof parsed.input === 'object') {
    return parsed.input
  }
  return parsed
}

function normalizeReport(parsed) {
  const source = unwrapReport(parsed)
  const summary = coerceString(valueByFoldedKeys(source, SUMMARY_KEYS))
  const rootCause = coerceString(valueByFoldedKeys(source, ROOT_KEYS))
  let steps = coerceSteps(valueByFoldedKeys(source, STEP_KEYS)).slice(0, 5)
  if (steps.length === 0 && source && typeof source === 'object' && !Array.isArray(source)) {
    const nestedArray = Object.values(source).find(
      (value) => Array.isArray(value) && value.length > 0,
    )
    steps = coerceSteps(nestedArray).slice(0, 5)
  }

  if (!summary || !rootCause || steps.length === 0) {
    const error = appError('errors.incompleteReport')
    error.debugKeys =
      source && typeof source === 'object' && !Array.isArray(source)
        ? Object.keys(source)
        : []
    throw error
  }

  return { summary, rootCause, steps }
}

function extractNamedToolInput(payload, name) {
  if (!payload || !Array.isArray(payload.content)) {
    return null
  }
  const blocks = payload.content.filter(
    (item) => item && item.type === 'tool_use' && item.name === name,
  )
  for (const block of blocks) {
    if (typeof block.input === 'string') {
      const parsed = tryParseJson(block.input)
      if (parsed && typeof parsed === 'object') {
        return parsed
      }
      continue
    }
    if (block.input && typeof block.input === 'object') {
      return block.input
    }
  }
  return null
}

function extractToolInput(payload) {
  return extractNamedToolInput(payload, REPORT_TOOL_NAME)
}

function parseReport(rawText) {
  const stripped = String(rawText)
    .replace(/```(?:json)?/gi, '')
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

  return normalizeReport(parsed)
}

function reportFromPayload(payload) {
  const fromTool = extractToolInput(payload)
  let lastError = null
  if (fromTool) {
    try {
      return normalizeReport(fromTool)
    } catch (error) {
      lastError = error
    }
  }

  try {
    return parseReport(extractText(payload))
  } catch (error) {
    throw lastError || error
  }
}

module.exports = {
  MAX_LOG_CHARS,
  HEAD_CHARS,
  TAIL_CHARS,
  REPORT_TOOL_NAME,
  truncateLog,
  tryParseJson,
  extractText,
  extractNamedToolInput,
  extractToolInput,
  normalizeReport,
  parseReport,
  reportFromPayload,
}
