import { useState } from 'react'
import { Pencil } from 'lucide-react'

import { EventForm, toEventFields, toFormValues } from '@/features/events'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui'
import { useT } from '@/shared/i18n'
import type { EditEventDialogProps } from '../types'

export function EditEventDialog({ event, disabled = false, onSave }: EditEventDialogProps) {
  const t = useT()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setError(undefined)
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled} >
          <Pencil aria-hidden="true" />
          {t('edit.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-4rem)] w-[calc(100vw-2rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 px-6 pt-6 pr-12 pb-4">
          <DialogTitle className="text-2xl font-semibold">{t('edit.button')}</DialogTitle>
          <DialogDescription className="sr-only">{t('edit.description')}</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 pb-6">
          {open && (
            <EventForm
              initialValues={toFormValues(event)}
              submitLabel={t('edit.saveChanges')}
              submitting={saving}
              error={error}
              onCancel={() => setOpen(false)}
              onSubmit={async (values) => {
                setSaving(true)
                setError(undefined)
                try {
                  await onSave(toEventFields(values))
                  setOpen(false)
                } catch (failure) {
                  setError(failure instanceof Error ? failure.message : t('edit.failed'))
                } finally {
                  setSaving(false)
                }
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
