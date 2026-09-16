import { useState } from 'react'
import { useI18n } from '../i18n/context'
import type { TranslationKey } from '../i18n/translations'

type CopyButtonProps = {
  text: string
  labelKey?: TranslationKey
}

export function CopyButton({ text, labelKey = 'copy.copy' }: CopyButtonProps) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => {
        void handleCopy()
      }}
      className="text-xs text-slate-500 underline-offset-2 hover:text-farm-300 hover:underline"
    >
      {copied ? t('copy.copied') : t(labelKey)}
    </button>
  )
}
