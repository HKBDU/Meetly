import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import { createJitsiRoomUrl, meetingProvider, normalizeMeetingLink } from '../meetingLink'
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
          {/* Chưa có phòng sẵn: Meetly tạo link Jitsi Meet, không cần tài khoản hay quyền Google.
              Vạch "hoặc" + nút viền rộng bằng ô nhập để nhìn ra đây là một lựa chọn bấm được, không phải câu gợi ý */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
            <span className="h-px flex-1 bg-border" />
            {t('meet.or')}
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            // Button mặc định không xuống dòng: cho wrap để không tràn ngang trên màn hình hẹp
            className="h-auto min-h-10 w-full whitespace-normal py-2 text-brand"
            disabled={saving}
            onClick={() => {
              setValue(createJitsiRoomUrl())
              setError(null)
            }}
          >
            <Sparkles aria-hidden="true" />
            {t('meet.autoCreate')}
          </Button>
          {meetingProvider(value.trim()) === 'jitsi' && (
            <p className="-mt-2 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">{t('meet.jitsiNote')}</p>
          )}
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
