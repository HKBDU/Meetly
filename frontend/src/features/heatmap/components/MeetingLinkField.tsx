import { useRef } from 'react'
import { ClipboardPaste } from 'lucide-react'
import { toast } from 'sonner'

import { Button, Input, Label } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'

interface MeetingLinkFieldProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
}

export function MeetingLinkField({ value, onChange, disabled, invalid }: MeetingLinkFieldProps) {
  const t = useT()
  const inputRef = useRef<HTMLInputElement>(null)

  async function paste() {
    try {
      if (!navigator.clipboard?.readText) throw new Error('Clipboard unavailable')
      onChange(await navigator.clipboard.readText())
      inputRef.current?.focus()
    } catch {
      toast.error(t('meet.pasteFailed'))
    }
  }

  return (
    <div className="relative">
      <Label className="sr-only" htmlFor="meeting-link-input">{t('meet.input')}</Label>
      <Input
        ref={inputRef}
        id="meeting-link-input"
        type="url"
        inputMode="url"
        placeholder="https://meet.google.com/..."
        autoComplete="url"
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className="pr-12"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-1.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        aria-label={t('meet.paste')}
        title={t('meet.paste')}
        disabled={disabled}
        onClick={() => void paste()}
      >
        <ClipboardPaste aria-hidden="true" />
      </Button>
    </div>
  )
}
