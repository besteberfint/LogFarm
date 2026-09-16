import { useRef, useState } from 'react'
import { useI18n } from '../i18n/context'
import { LogFileError, readLogFile } from '../lib/readLogFile'
import type { AppError } from '../types'

const LONG_LOG_LIMIT = 80_000

type LogInputProps = {
  value: string
  disabled: boolean
  canAnalyze: boolean
  isAnalyzing: boolean
  lockHint?: string
  onChange: (value: string) => void
  onAnalyze: () => void
  onCancel: () => void
  onFileError: (error: AppError | null) => void
}

export function LogInput({
  value,
  disabled,
  canAnalyze,
  isAnalyzing,
  lockHint,
  onChange,
  onAnalyze,
  onCancel,
  onFileError,
}: LogInputProps) {
  const { t, formatNumber } = useI18n()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileTruncated, setFileTruncated] = useState(false)
  const [droppedExtra, setDroppedExtra] = useState(false)

  async function loadFile(file: File | undefined, extraCount = 0) {
    if (!file || disabled) {
      return
    }

    try {
      const result = await readLogFile(file)
      onChange(result.text)
      setFileName(result.fileName)
      setFileTruncated(result.truncatedFile)
      setDroppedExtra(extraCount > 0)
      onFileError(null)
    } catch (error) {
      const code = error instanceof LogFileError ? error.code : 'errors.fileReadFailed'
      onFileError({ code })
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="log-input" className="text-sm font-medium text-slate-300">
          {t('log.label')}
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="text-xs text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline disabled:no-underline disabled:opacity-50"
        >
          {t('log.pickFile')}
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".log,.txt,.json,.out,.err,text/plain,application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          void loadFile(file)
          event.target.value = ''
        }}
      />
      <div
        onDragEnter={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          event.dataTransfer.dropEffect = 'copy'
        }}
        onDragLeave={(event) => {
          event.preventDefault()
          if (event.currentTarget === event.target) {
            setIsDragging(false)
          }
        }}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          const file = event.dataTransfer.files[0]
          const extraCount = Math.max(0, event.dataTransfer.files.length - 1)
          void loadFile(file, extraCount)
        }}
        className={`relative ${isDragging ? 'ring-2 ring-farm-500 ring-offset-2 ring-offset-farm-950' : ''}`}
      >
        <textarea
          id="log-input"
          value={value}
          onChange={(event) => {
            setFileName(null)
            setFileTruncated(false)
            setDroppedExtra(false)
            onChange(event.target.value)
          }}
          disabled={disabled}
          placeholder={t('log.placeholder')}
          spellCheck={false}
          className="min-h-48 w-full flex-1 resize-y rounded-xl border border-farm-800 bg-farm-900 px-4 py-3 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-farm-500 focus:ring-1 focus:ring-farm-500 disabled:opacity-60 lg:min-h-80"
        />
        {isDragging ? (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-farm-950/70 text-sm text-farm-300">
            {t('log.dropHere')}
          </p>
        ) : null}
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            {t('log.charCount', { count: formatNumber(value.length) })}
          </p>
          {isAnalyzing ? (
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-farm-700 bg-farm-800 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-farm-700"
            >
              {t('log.cancel')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={!canAnalyze}
              className="rounded-lg bg-farm-500 px-4 py-2 text-sm font-medium text-farm-950 hover:bg-farm-400 disabled:cursor-not-allowed disabled:bg-farm-800 disabled:text-slate-400"
            >
              {t('log.analyze')}
            </button>
          )}
        </div>
        {lockHint ? <p className="text-xs text-amber-300">{lockHint}</p> : null}
        {fileName ? (
          <p className="text-xs text-slate-500">
            {t('log.loadedFile', { name: fileName })}
            {fileTruncated ? ` (${t('log.loadedFileTruncated')})` : ''}
            {droppedExtra ? ` ${t('log.loadedFileExtra')}` : ''}
          </p>
        ) : null}
        {value.length > LONG_LOG_LIMIT ? (
          <p className="text-xs text-amber-300">
            {t('log.longWarning', { limit: formatNumber(LONG_LOG_LIMIT) })}
          </p>
        ) : null}
      </div>
    </div>
  )
}
