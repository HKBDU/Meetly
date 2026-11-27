import { useState, type FormEvent } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { toast } from 'sonner'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import { normalizeMeetingLink } from '../meetingLink'
import { MeetingLinkField } from './MeetingLinkField'

interface MeetingLinkDialogProps {
  meetingUrl: string | null
  onSave: (meetingUrl: string | null) => Promise<void>
  disabled?: boolean
}

export function MeetingLinkDialog({ meetingUrl, onSave, disabled = false }: MeetingLinkDialogProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editing = Boolean(meetingUrl)

  function changeOpen(next: boolean) {
    if (saving) return
    if (next) {
      setValue(meetingUrl ?? '')
      setError(null)
    }
    setOpen(next)
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (saving) return
    const result = normalizeMeetingLink(value)
    if (result.error) {
      setError(t(result.error === 'tooLong' ? 'meet.tooLong' : 'meet.invalid'))
      return
    }
    if (result.url === meetingUrl) {
      setOpen(false)
      return
    }
    setSaving(true)
    setError(null)
    try {
      await onSave(result.url)
      setOpen(false)
      toast.success(t('meet.saved'))
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : t('api.updateMeetingUrl'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" className="w-full" disabled={disabled}>
          {editing ? <Pencil aria-hidden="true" /> : <Plus aria-hidden="true" />}
          {t(editing ? 'meet.edit' : 'meet.add')}
        </Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="gap-4 sm:max-w-sm">
        <DialogTitle className="sr-only">{t(editing ? 'meet.edit' : 'meet.add')}</DialogTitle>
        <DialogDescription className={editing ? 'sr-only' : undefined}>
          {t(editing ? 'meet.input' : 'meet.addHint')}
        </DialogDescription>
        <form onSubmit={(event) => void submit(event)} className="space-y-4" noValidate>
          <MeetingLinkField
            value={value}
            onChange={(next) => {
              setValue(next)
              setError(null)
            }}
            disabled={saving}
            invalid={Boolean(error)}
          />
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" disabled={saving} onClick={() => changeOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saving || (!editing && !value.trim())}>
              {saving ? t('common.saving') : t('meet.confirm')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
