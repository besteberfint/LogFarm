import type { AppError } from '../types'

const MAX_FILE_BYTES = 2_000_000

export type LogFileRead = {
  text: string
  fileName: string
  truncatedFile: boolean
}

// Mesaj değil kod taşır; metni arayüz seçili dile göre üretir.
export class LogFileError extends Error implements AppError {
  code: string

  constructor(code: string) {
    super(code)
    this.name = 'LogFileError'
    this.code = code
  }
}

export async function readLogFile(file: File): Promise<LogFileRead> {
  if (!file || file.size === 0) {
    throw new LogFileError('errors.fileEmpty')
  }

  const truncatedFile = file.size > MAX_FILE_BYTES
  const blob = truncatedFile ? file.slice(0, MAX_FILE_BYTES) : file
  const text = await blob.text()

  if (text.includes('\u0000')) {
    throw new LogFileError('errors.fileNotText')
  }

  const trimmed = text.replace(/^\uFEFF/, '')
  if (!trimmed.trim()) {
    throw new LogFileError('errors.fileNoText')
  }

  return {
    text: trimmed,
    fileName: file.name,
    truncatedFile,
  }
}
