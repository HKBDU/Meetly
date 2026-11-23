import { useEffect, useRef, useState, type ComponentProps } from 'react'
import { Check, Copy } from 'lucide-react'

import { copyToClipboard } from '@/shared/lib/share'
import { Button } from '@/shared/components/ui/button'

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, 'onClick'> {
  value: string
  successMessage: string
  label?: string
}

/** Nút copy đổi thành "Copied" vài giây để người dùng biết đã copy xong */
export function CopyButton({ value, successMessage, label = 'Copy', children, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number | null>(null)

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current)
  }, [])

  return (
    <Button
      type="button"
      {...props}
      onClick={async () => {
        if (!(await copyToClipboard(value, successMessage))) return
        setCopied(true)
        if (timer.current !== null) window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {children ?? (copied ? 'Copied' : label)}
    </Button>
  )
}
