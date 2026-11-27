import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Check, Copy } from 'lucide-react'

import { copyToClipboard } from '@/shared/lib/share'
import { Button } from '@/shared/components/ui/button'
import { useT } from '@/shared/i18n'

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  value: string
  successMessage: string
  label?: string
  iconPosition?: 'start' | 'end'
  /** Gọi sau khi copy thành công */
  onCopied?: () => void
}

/** Nút copy đổi thành "Copied" vài giây để người dùng biết đã copy xong */
export function CopyButton({ value, successMessage, label, iconPosition = 'start', onCopied, children, ...props }: CopyButtonProps) {
  const t = useT()
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  const icon = copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />

  return (
    <Button
      type="button"
      {...props}
      onClick={async () => {
        if (!(await copyToClipboard(value, successMessage))) return
        setCopied(true)
        onCopied?.()
        if (timer.current !== null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 2000)
      }}
    >
      {iconPosition === 'start' && icon}
      {children ?? (copied ? t('common.copied') : (label ?? t('common.copy')))}
      {iconPosition === 'end' && icon}
    </Button>
  )
}
